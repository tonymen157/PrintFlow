const path = require('path');
// Dotenv es opcional — en producción, Fly.io inyecta las variables como secrets
try {
  require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
} catch {
  // No hay .env disponible, las variables vendrán del entorno (Fly.io secrets)
}

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ====== SEGURIDAD: Exigir JWT_SECRET desde entorno ======
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET no configurado o demasiado corto. Configúralo en .env con al menos 32 caracteres.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// ====== MIDDLEWARES DE SEGURIDAD ======
// Headers HTTP seguros (CSP, HSTS, X-Frame-Options, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting global: 100 requests por IP cada 15 min
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Inténtalo más tarde.' },
}));

// Rate limiting más estricto para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de autenticación. Espera 15 minutos.' },
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ====== DIRECTORIO DE AVATARES ======
const AVATARS_DIR = path.join(__dirname, '../public/avatars');
if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

// ====== LOGGER DE SEGURIDAD ======
const securityLog = (event, details) => {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp} | ${event} | ${JSON.stringify(details)}`);
};

// ====== BASE DE DATOS ======
const dbPath = path.join(__dirname, '../data/printflow.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('DB Error:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite');
});

// Enable WAL mode for better concurrency
db.run('PRAGMA journal_mode=WAL');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    shopName TEXT,
    avatarUrl TEXT,
    role TEXT DEFAULT 'user',
    approved INTEGER DEFAULT 0,
    approvedAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    plan TEXT DEFAULT 'free',
    durationMonths INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME,
    cancelledAt DATETIME,
    FOREIGN KEY (userId) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user_defaults (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    defaultPrintType TEXT DEFAULT 'color',
    defaultPaperSize TEXT DEFAULT 'a4',
    defaultWorkType TEXT DEFAULT 'impresion',
    defaultCopies INTEGER DEFAULT 1,
    FOREIGN KEY (userId) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user_pricing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    impresionPrices TEXT,
    copiasPrices TEXT,
    libroPrices TEXT,
    impresionLaserPrices TEXT,
    copiasLaserPrices TEXT,
    libroLaserPrices TEXT,
    currency TEXT DEFAULT 'USD',
    FOREIGN KEY (userId) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS quotes_history (
    id TEXT PRIMARY KEY,
    userId INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    total REAL NOT NULL,
    copies INTEGER NOT NULL,
    paperSize TEXT NOT NULL,
    lines TEXT NOT NULL,
    status TEXT DEFAULT 'pagado',
    FOREIGN KEY (userId) REFERENCES users(id)
  )`);
});

// ====== MIDDLEWARE DE AUTENTICACIÓN ======
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    securityLog('AUTH_MISSING_TOKEN', { ip: req.ip, path: req.path });
    return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verificar expiración del token
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      securityLog('AUTH_EXPIRED_TOKEN', { ip: req.ip, userId: decoded.userId });
      return res.status(401).json({ error: 'Token expirado. Cierra sesión e inicia de nuevo.' });
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    securityLog('AUTH_INVALID_TOKEN', { ip: req.ip, error: err.message });
    return res.status(401).json({ error: 'Sesión inválida. Cierra sesión e inicia de nuevo.' });
  }
};

const adminAuth = (req, res, next) => {
  if (req.userRole !== 'admin') {
    securityLog('AUTH_ADMIN_REQUIRED', { userId: req.userId, path: req.path });
    return res.status(403).json({ error: 'Acceso de administrador requerido' });
  }
  next();
};

// ====== RUTAS DE AUTENTICACIÓN ======
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { email, password, shopName } = req.body;

  // Validaciones básicas
  if (!email || !password || !shopName) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  try {
    const hashed = await bcrypt.hash(password, 12);

    db.run(
      'INSERT INTO users (email, password, shopName, approved) VALUES (?, ?, ?, 0)',
      [email, hashed, shopName.trim()],
      function (err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            securityLog('REGISTER_DUPLICATE_EMAIL', { email, ip: req.ip });
            return res.status(400).json({ error: 'Este email ya está registrado' });
          }
          securityLog('REGISTER_ERROR', { email, ip: req.ip, error: err.message });
          return res.status(500).json({ error: 'Error al registrar usuario' });
        }

        const userId = this.lastID;
        db.run('INSERT INTO user_defaults (userId) VALUES (?)', [userId]);
        db.run('INSERT INTO user_pricing (userId, currency) VALUES (?, ?)', [userId, 'USD']);
        db.run(
          'INSERT INTO subscriptions (userId, plan, durationMonths, status) VALUES (?, "free", 0, "inactive")',
          [userId]
        );

        securityLog('REGISTER_SUCCESS', { userId, email, ip: req.ip });
        res.json({ message: 'Registro exitoso. Espera la aprobación del administrador.', userId });
      }
    );
  } catch (err) {
    securityLog('REGISTER_EXCEPTION', { email, ip: req.ip, error: err.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      securityLog('LOGIN_DB_ERROR', { email, ip: req.ip, error: err.message });
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      securityLog('LOGIN_FAILED', { email, ip: req.ip });
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Verificar si la suscripción expiró
    let isApproved = user.approved === 1;
    if (isApproved) {
      const sub = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM subscriptions WHERE userId = ?', [user.id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      if (sub && sub.expiresAt) {
        const expiry = new Date(sub.expiresAt);
        const cancelled = sub.cancelledAt && new Date(sub.cancelledAt) <= new Date();
        if (expiry < new Date() || cancelled) {
          isApproved = false;
          db.run('UPDATE users SET approved = 0 WHERE id = ?', [user.id]);
          db.run("UPDATE subscriptions SET status = 'expired' WHERE userId = ? AND status != 'cancelled'", [user.id]);
          securityLog('LOGIN_SUBSCRIPTION_EXPIRED', { userId: user.id, email });
        }
      }
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        shopName: user.shopName,
        role: user.role,
        approved: isApproved ? 1 : 0,
      },
      JWT_SECRET,
      { expiresIn: '30d' } // Token válido por 30 días
    );

    securityLog('LOGIN_SUCCESS', { userId: user.id, email, ip: req.ip });

    res.json({
      token,
      userId: user.id,
      email: user.email,
      shopName: user.shopName,
      role: user.role,
      approved: isApproved ? 1 : 0,
    });
  });
});

// ====== RUTAS DE CONFIGURACIÓN ======
app.get('/api/config/defaults', auth, (req, res) => {
  db.get('SELECT defaultPrintType, defaultPaperSize, defaultWorkType, defaultCopies FROM user_defaults WHERE userId = ?', [req.userId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Configuración no encontrada' });
    res.json(row);
  });
});

app.put('/api/config/defaults', auth, (req, res) => {
  const { defaultPrintType, defaultPaperSize, defaultWorkType, defaultCopies } = req.body;

  // Validar valores permitidos
  const validPrintTypes = ['bw', 'color', 'laser'];
  const validPaperSizes = ['a4', 'a5', 'a3'];
  const validWorkTypes = ['impresion', 'copias', 'libro'];

  if (validPrintTypes.includes(defaultPrintType) === false) {
    return res.status(400).json({ error: 'Tipo de impresión inválido' });
  }
  if (validPaperSizes.includes(defaultPaperSize) === false) {
    return res.status(400).json({ error: 'Tamaño de papel inválido' });
  }
  if (validWorkTypes.includes(defaultWorkType) === false) {
    return res.status(400).json({ error: 'Tipo de trabajo inválido' });
  }
  if (typeof defaultCopies !== 'number' || defaultCopies < 1 || defaultCopies > 999) {
    return res.status(400).json({ error: 'Número de copias inválido (1-999)' });
  }

  db.run(
    `UPDATE user_defaults SET
     defaultPrintType = ?, defaultPaperSize = ?,
     defaultWorkType = ?, defaultCopies = ?
     WHERE userId = ?`,
    [defaultPrintType, defaultPaperSize, defaultWorkType, defaultCopies, req.userId],
    (err) => {
      if (err) {
        securityLog('CONFIG_DEFAULTS_ERROR', { userId: req.userId, error: err.message });
        return res.status(500).json({ error: 'Error al guardar configuración' });
      }
      res.json({ success: true });
    }
  );
});

app.get('/api/config/pricing', auth, (req, res) => {
  db.get(
    'SELECT impresionPrices, copiasPrices, libroPrices, impresionLaserPrices, copiasLaserPrices, libroLaserPrices, currency FROM user_pricing WHERE userId = ?',
    [req.userId],
    (err, row) => {
      if (err || !row) return res.status(404).json({ error: 'Configuración de precios no encontrada' });
      res.json(row);
    }
  );
});

app.put('/api/config/pricing', auth, (req, res) => {
  const { impresionPrices, copiasPrices, libroPrices, impresionLaserPrices, copiasLaserPrices, libroLaserPrices, currency } = req.body;

  // Validar que al menos un campo de precios esté presente
  if (!impresionPrices && !copiasPrices && !libroPrices && !impresionLaserPrices && !copiasLaserPrices && !libroLaserPrices) {
    return res.status(400).json({ error: 'Se requiere al menos un tipo de precio' });
  }

  db.run(
    `UPDATE user_pricing SET
     impresionPrices = ?, copiasPrices = ?, libroPrices = ?,
     impresionLaserPrices = ?, copiasLaserPrices = ?, libroLaserPrices = ?, currency = ?
     WHERE userId = ?`,
    [
      impresionPrices ? JSON.stringify(impresionPrices) : null,
      copiasPrices ? JSON.stringify(copiasPrices) : null,
      libroPrices ? JSON.stringify(libroPrices) : null,
      impresionLaserPrices ? JSON.stringify(impresionLaserPrices) : null,
      copiasLaserPrices ? JSON.stringify(copiasLaserPrices) : null,
      libroLaserPrices ? JSON.stringify(libroLaserPrices) : null,
      currency || 'USD',
      req.userId
    ],
    (err) => {
      if (err) {
        securityLog('CONFIG_PRICING_ERROR', { userId: req.userId, error: err.message });
        return res.status(500).json({ error: 'Error al guardar precios' });
      }
      res.json({ success: true });
    }
  );
});

app.get('/api/auth/me', auth, (req, res) => {
  // Filtrar campos sensibles de la respuesta
  db.get(
    `SELECT u.id, u.email, u.shopName, u.avatarUrl, u.role, u.approved,
            s.plan, s.status as subscriptionStatus, s.expiresAt as subscriptionExpiry,
            s.durationMonths as subscriptionDuration
            FROM users u
            LEFT JOIN subscriptions s ON u.id = s.userId
            WHERE u.id = ?`,
    [req.userId],
    (err, user) => {
      if (err || !user) return res.status(404).json({ error: 'Usuario no encontrado' });
      // No devolver createdAt ni approvedAt al cliente
      res.json(user);
    }
  );
});

app.post('/api/auth/avatar', auth, (req, res) => {
  const { avatarUrl } = req.body;

  if (!avatarUrl || !avatarUrl.startsWith('data:image/')) {
    return res.status(400).json({ error: 'No se proporcionó imagen válida' });
  }

  // Validar tipo MIME real (no confiar en lo que el cliente envía)
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const detectedType = avatarUrl.match(/^data:(image\/\w+);base64,/);
  if (!detectedType || !validTypes.includes(detectedType[1])) {
    return res.status(400).json({ error: 'Solo se permiten imágenes JPEG, PNG o WebP' });
  }

  // Validar tamaño base64 (máx 3MB antes de decodificar, ~4MB en base64)
  const base64Data = avatarUrl.replace(/^data:image\/\w+;base64,/, '');
  const fileSizeKB = (base64Data.length * 3) / 4 / 1024;
  if (fileSizeKB > 3072) {
    return res.status(400).json({ error: 'La imagen no debe superar 3MB' });
  }

  const timestamp = Date.now();
  const ext = detectedType[1] === 'image/jpeg' ? 'jpg' : detectedType[1] === 'image/webp' ? 'webp' : 'png';
  const filename = `user_${req.userId}_${timestamp}.${ext}`;
  const filepath = path.join(AVATARS_DIR, filename);

  fs.writeFile(filepath, base64Data, 'base64', (err) => {
    if (err) {
      securityLog('AVATAR_SAVE_ERROR', { userId: req.userId, error: err.message });
      return res.status(500).json({ error: 'Error al guardar la imagen' });
    }

    const avatarPath = '/avatars/' + filename;

    // Eliminar avatar anterior si existe
    db.get('SELECT avatarUrl FROM users WHERE id = ?', [req.userId], (err, row) => {
      if (row && row.avatarUrl) {
        const oldPath = path.join(__dirname, '../public', row.avatarUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      db.run('UPDATE users SET avatarUrl = ? WHERE id = ?', [avatarPath, req.userId], (err) => {
        if (err) {
          securityLog('AVATAR_DB_ERROR', { userId: req.userId, error: err.message });
          return res.status(500).json({ error: 'Error al actualizar avatar' });
        }
        securityLog('AVATAR_UPDATED', { userId: req.userId, filename });
        res.json({ success: true, avatarUrl: avatarPath });
      });
    });
  });
});

app.put('/api/auth/profile', auth, (req, res) => {
  const { shopName, email } = req.body;
  const updates = [];
  const values = [];

  if (shopName !== undefined) {
    updates.push('shopName = ?');
    values.push(shopName.trim());
  }
  if (email !== undefined) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    updates.push('email = ?');
    values.push(email);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
  }

  values.push(req.userId);

  db.run(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function (err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ error: 'Este email ya está en uso' });
        }
        securityLog('PROFILE_UPDATE_ERROR', { userId: req.userId, error: err.message });
        return res.status(500).json({ error: 'Error al actualizar perfil' });
      }
      securityLog('PROFILE_UPDATED', { userId: req.userId });
      res.json({ success: true, shopName, email });
    }
  );
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ====== RUTAS ADMIN ======
app.get('/api/admin/users', auth, adminAuth, (req, res) => {
  // Filtrar campos sensibles: NO devolver password, approvedAt, createdAt
  db.all(
    `SELECT u.id, u.email, u.shopName, u.approved, u.role,
            s.plan, s.status as subscriptionStatus, s.expiresAt as subscriptionExpiry,
            s.durationMonths as subscriptionDuration
            FROM users u
            LEFT JOIN subscriptions s ON u.id = s.userId
            ORDER BY u.createdAt DESC`,
    [],
    (err, users) => {
      if (err) {
        securityLog('ADMIN_GET_USERS_ERROR', { ip: req.ip, error: err.message });
        return res.status(500).json({ error: 'Error al obtener usuarios' });
      }
      securityLog('ADMIN_GET_USERS', { adminId: req.userId, userCount: users.length });
      res.json(users);
    }
  );
});

app.put('/api/admin/users/:id/approve', auth, adminAuth, (req, res) => {
  const { id } = req.params;
  let durationMonths = parseInt(req.body.durationMonths) || 1;

  // ====== SEGURIDAD: Validar duración permitida ======
  if (isNaN(durationMonths) || durationMonths < 1 || durationMonths > 24) {
    return res.status(400).json({ error: 'Duración inválida. Debe estar entre 1 y 24 meses.' });
  }

  // Validar que el usuario existe
  db.get('SELECT id FROM users WHERE id = ?', [id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    db.get('SELECT * FROM subscriptions WHERE userId = ?', [id], (err, sub) => {
      if (err) {
        securityLog('APPROVE_DB_ERROR', { adminId: req.userId, targetUserId: id, error: err.message });
        return res.status(500).json({ error: 'Error al aprobar usuario' });
      }

      if (sub) {
        db.run(
          `UPDATE subscriptions SET plan = 'pro', durationMonths = ?, status = 'active',
           startedAt = CURRENT_TIMESTAMP, expiresAt = ?, cancelledAt = NULL
           WHERE userId = ?`,
          [durationMonths, expiresAt.toISOString(), id],
          function (err) {
            if (err) {
              securityLog('APPROVE_UPDATE_ERROR', { adminId: req.userId, targetUserId: id, error: err.message });
              return res.status(500).json({ error: 'Error al actualizar suscripción' });
            }
            db.run('UPDATE users SET approved = 1, approvedAt = CURRENT_TIMESTAMP WHERE id = ?', [id], (err2) => {
              if (err2) {
                securityLog('APPROVE_USER_UPDATE_ERROR', { adminId: req.userId, targetUserId: id, error: err2.message });
                return res.status(500).json({ error: 'Error al actualizar usuario' });
              }
              securityLog('USER_APPROVED', { adminId: req.userId, targetUserId: id, durationMonths, expiresAt: expiresAt.toISOString() });
              res.json({
                success: true,
                message: 'Usuario aprobado con suscripcion de ' + durationMonths + ' mes(es)',
                approved: 1,
                subscription: { plan: 'pro', durationMonths, expiresAt: expiresAt.toISOString(), status: 'active' },
              });
            });
          }
        );
      } else {
        db.run(
          `INSERT INTO subscriptions (userId, plan, durationMonths, status, startedAt, expiresAt)
           VALUES (?, 'pro', ?, 'active', CURRENT_TIMESTAMP, ?)`,
          [id, durationMonths, expiresAt.toISOString()],
          function (err) {
            if (err) {
              securityLog('APPROVE_INSERT_ERROR', { adminId: req.userId, targetUserId: id, error: err.message });
              return res.status(500).json({ error: 'Error al crear suscripción' });
            }
            db.run('UPDATE users SET approved = 1, approvedAt = CURRENT_TIMESTAMP WHERE id = ?', [id], (err2) => {
              if (err2) {
                securityLog('APPROVE_USER_INSERT_ERROR', { adminId: req.userId, targetUserId: id, error: err2.message });
                return res.status(500).json({ error: 'Error al actualizar usuario' });
              }
              securityLog('USER_APPROVED', { adminId: req.userId, targetUserId: id, durationMonths, expiresAt: expiresAt.toISOString() });
              res.json({
                success: true,
                message: 'Usuario aprobado con suscripcion de ' + durationMonths + ' mes(es)',
                approved: 1,
                subscription: { plan: 'pro', durationMonths, expiresAt: expiresAt.toISOString(), status: 'active' },
              });
            });
          }
        );
      }
    });
  });
});

// Revoke: cancel subscription (admin can reactivate later)
// SOFT DELETE: solo cancela suscripción, NO elimina el usuario
app.put('/api/admin/users/:id/revoke', auth, adminAuth, (req, res) => {
  const { id } = req.params;

  db.run("UPDATE subscriptions SET status = 'cancelled', cancelledAt = CURRENT_TIMESTAMP WHERE userId = ?", [id], function (err) {
    if (err) {
      securityLog('REVOKE_ERROR', { adminId: req.userId, targetUserId: id, error: err.message });
      return res.status(500).json({ error: 'Error al cancelar suscripción' });
    }
    db.run('UPDATE users SET approved = 0, approvedAt = NULL WHERE id = ?', [id], (err2) => {
      if (err2) {
        securityLog('REVOKE_USER_UPDATE_ERROR', { adminId: req.userId, targetUserId: id, error: err2.message });
        return res.status(500).json({ error: 'Error al revocar acceso' });
      }
      securityLog('USER_REVOKED', { adminId: req.userId, targetUserId: id });
      res.json({ success: true, message: 'Suscripcion cancelada, acceso revocado' });
    });
  });
});

// Reject: SOFT DELETE — marca usuario como rechazado, NO lo elimina
// Se mantiene el endpoint para compatibilidad pero ahora hace soft delete
app.put('/api/admin/users/:id/reject', auth, adminAuth, (req, res) => {
  const { id } = req.params;

  db.run("UPDATE subscriptions SET status = 'cancelled', cancelledAt = CURRENT_TIMESTAMP WHERE userId = ?", [id], function (err) {
    if (err) {
      securityLog('REJECT_ERROR', { adminId: req.userId, targetUserId: id, error: err.message });
      return res.status(500).json({ error: 'Error al rechazar usuario' });
    }
    db.run('UPDATE users SET approved = 0, approvedAt = NULL WHERE id = ?', [id], (err2) => {
      if (err2) {
        securityLog('REJECT_USER_UPDATE_ERROR', { adminId: req.userId, targetUserId: id, error: err2.message });
        return res.status(500).json({ error: 'Error al rechazar usuario' });
      }
      securityLog('USER_REJECTED', { adminId: req.userId, targetUserId: id });
      res.json({ success: true, message: 'Usuario rechazado (suscripcion cancelada, permanece en el sistema)' });
    });
  });
});

// ====== ADMIN SETUP ======
app.post('/api/admin/setup', async (req, res) => {
  const { email, password, shopName } = req.body;

  if (!email || !password || !shopName) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  try {
    const hashed = await bcrypt.hash(password, 12);

    db.get('SELECT * FROM users WHERE role = "admin" LIMIT 1', [], (err, admin) => {
      if (err) {
        securityLog('ADMIN_SETUP_ERROR', { error: err.message });
        return res.status(500).json({ error: 'Error al verificar administrador' });
      }
      if (admin) return res.status(400).json({ error: 'Ya existe un administrador' });

      db.run(
        'INSERT INTO users (email, password, shopName, role, approved) VALUES (?, ?, ?, "admin", 1)',
        [email, hashed, shopName.trim()],
        function (err) {
          if (err) {
            securityLog('ADMIN_SETUP_INSERT_ERROR', { error: err.message });
            return res.status(500).json({ error: 'Error al crear administrador' });
          }
          const userId = this.lastID;
          db.run('INSERT INTO user_defaults (userId) VALUES (?)', [userId]);
          db.run('INSERT INTO user_pricing (userId, currency) VALUES (?, ?)', [userId, 'USD']);
          db.run(
            'INSERT INTO subscriptions (userId, plan, durationMonths, status) VALUES (?, "pro", 0, "active")',
            [userId]
          );
          const token = jwt.sign({ userId: userId, email, shopName, role: 'admin' }, JWT_SECRET, { expiresIn: '30d' });
          securityLog('ADMIN_CREATED', { userId: userId, email });
          res.json({ token, userId, email, shopName, role: 'admin' });
        }
      );
    });
  } catch (e) {
    securityLog('ADMIN_SETUP_EXCEPTION', { error: e.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ====== RUTAS DE HISTORIAL DE COTIZACIONES ======
app.get('/api/quotes', auth, (req, res) => {
  db.all(
    'SELECT id, createdAt, total, copies, paperSize, lines, status FROM quotes_history WHERE userId = ? ORDER BY createdAt DESC',
    [req.userId],
    (err, rows) => {
      if (err) {
        securityLog('QUOTES_GET_ERROR', { userId: req.userId, error: err.message });
        return res.status(500).json({ error: 'Error al obtener historial' });
      }
      res.json(rows);
    }
  );
});

app.get('/api/quotes/:id', auth, (req, res) => {
  db.get(
    'SELECT * FROM quotes_history WHERE id = ? AND userId = ?',
    [req.params.id, req.userId],
    (err, row) => {
      if (err || !row) return res.status(404).json({ error: 'Cotización no encontrada' });
      res.json(row);
    }
  );
});

app.post('/api/quotes', auth, (req, res) => {
  const { id, createdAt, total, copies, paperSize, lines, status } = req.body;
  db.run(
    'INSERT OR REPLACE INTO quotes_history (id, userId, createdAt, total, copies, paperSize, lines, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, req.userId, createdAt, total, copies, paperSize, JSON.stringify(lines), status || 'pagado'],
    function (err) {
      if (err) {
        securityLog('QUOTE_SAVE_ERROR', { userId: req.userId, error: err.message });
        return res.status(500).json({ error: 'Error al guardar cotización' });
      }
      res.json({ success: true, id });
    }
  );
});

app.delete('/api/quotes/:id', auth, (req, res) => {
  db.run(
    'DELETE FROM quotes_history WHERE id = ? AND userId = ?',
    [req.params.id, req.userId],
    function (err) {
      if (err) {
        securityLog('QUOTE_DELETE_ERROR', { userId: req.userId, error: err.message });
        return res.status(500).json({ error: 'Error al eliminar cotización' });
      }
      res.json({ success: true });
    }
  );
});

app.listen(PORT, () => {
  console.log(`[SECURITY] Server running on port ${PORT} with security middleware`);
  console.log(`[SECURITY] JWT Secret is configured: ${JWT_SECRET ? 'YES' : 'NO'}`);
});
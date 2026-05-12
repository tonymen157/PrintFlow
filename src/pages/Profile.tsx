import { useState, useEffect, useRef } from 'react';
import AvatarEditor from 'react-avatar-editor';

interface ProfileProps {
  onClose?: () => void;
}

interface UserData {
  id: number;
  email: string;
  shopName: string;
  avatarUrl?: string;
  role: string;
  subscriptionStatus?: string;
  approved: number;
  createdAt: string;
}

export function Profile({ onClose }: ProfileProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editingShopName, setEditingShopName] = useState(false);
  const [shopNameInput, setShopNameInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<AvatarEditor>(null);

  // Estado para el flujo de subida con preview
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editorScale, setEditorScale] = useState(1);

  // Obtener la URL correcta del avatar (resuelve URLs relativas del backend)
  const getAvatarUrl = (url?: string): string => {
    if (!url) return '';
    // Si es data URL antigua o URL absoluta, devolver tal cual
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    // Si es URL relativa del backend (/avatars/...), prefijar con el origen del backend
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
    return `${apiBase}${url}`;
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Perfil cargado:', data);
          setUser(data);
        } else {
          const localData = {
            email: localStorage.getItem('userEmail') || '',
            shopName: localStorage.getItem('userShopName') || '',
            role: localStorage.getItem('userRole') || 'user'
          };
          setUser({ id: 0, ...localData, approved: 1, createdAt: '' } as UserData);
        }
      } catch {
        const localData = {
          email: localStorage.getItem('userEmail') || '',
          shopName: localStorage.getItem('userShopName') || '',
          role: localStorage.getItem('userRole') || 'user'
        };
        setUser({ id: 0, ...localData, approved: 1, createdAt: '' } as UserData);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedFile(file);
      setShowEditor(true);
      setEditorScale(1);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!editorRef.current || !selectedFile) return;

    setSavingAvatar(true);
    try {
      // Obtener canvas recortado del editor
      const canvas = editorRef.current.getImage();
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      console.log('Imagen recortada tamaño:', dataUrl.length, 'bytes');

      const token = localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${apiUrl}/auth/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ avatarUrl: dataUrl })
      });

      const responseData = await response.json();
      console.log('Respuesta del servidor:', response.status, responseData);

      if (response.ok) {
        // El backend devuelve una URL relativa como /avatars/user_1_123456.jpg
        const savedUrl = responseData.avatarUrl || dataUrl;
        const fullUrl = savedUrl.startsWith('/')
          ? `${apiUrl.replace('/api', '')}${savedUrl}`
          : savedUrl;
        setUser(prev => prev ? { ...prev, avatarUrl: fullUrl } : null);
        setShowEditor(false);
      } else {
        console.error('Error del servidor:', responseData);
        alert(`Error al guardar: ${responseData.error || response.status}`);
      }
    } catch (err) {
      console.error('Error al subir avatar:', err);
      alert('Error de conexión al guardar la imagen');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleCancelEditor = () => {
    setShowEditor(false);
    setSelectedFile(null);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Perfil Personal</h2>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
              ×
            </button>
          )}
        </div>
        <div className="flex justify-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-sm w-full">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Perfil Personal</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        )}
      </div>

      {/* EDITOR DE IMAGEN - Se muestra al seleccionar una foto nueva */}
      {showEditor && selectedFile && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Recortar imagen</h3>
          <div className="flex flex-col items-center gap-4">
            <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
              <AvatarEditor
                ref={editorRef}
                image={selectedFile}
                width={290}
                height={290}
                border={50}
                borderRadius={150}
                color={[255, 255, 255, 0.6]}
                scale={editorScale}
                rotate={0}
              />
            </div>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              value={editorScale}
              onChange={(e) => setEditorScale(Number(e.target.value))}
              className="w-full max-w-xs"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSaveAvatar}
                disabled={savingAvatar}
                className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 font-medium"
              >
                {savingAvatar ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={handleCancelEditor}
                disabled={savingAvatar}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-sm w-full">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group cursor-pointer" onClick={handleFileSelect}>
              {user?.avatarUrl ? (
                <img
                  src={getAvatarUrl(user.avatarUrl)}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.error('Error cargando avatar:', {
                      srcLength: target.src ? target.src.length : 0,
                      srcPreview: target.src ? target.src.substring(0, 80) : null
                    });
                    // Intentar recargar agregando timestamp para evitar cache
                    target.src = `${getAvatarUrl(user?.avatarUrl)}&t=${Date.now()}`;
                  }}
                  onLoad={() => console.log('Avatar cargado correctamente')}
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all">
                <span className="text-white text-lg opacity-0 group-hover:opacity-100">
                  {savingAvatar ? '⏳' : '✎'}
                </span>
              </div>
              {savingAvatar && (
                <div className="absolute inset-0 rounded-full bg-white bg-opacity-70 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="mt-3 text-center">
              <h3 className="font-semibold text-gray-800">{user?.shopName || 'Sin nombre'}</h3>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  user?.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {user?.subscriptionStatus === 'active' ? 'Pro' : 'Free'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm font-medium text-gray-800">{user?.email || 'No disponible'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Nombre tienda</span>
              {editingShopName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shopNameInput}
                    onChange={(e) => setShopNameInput(e.target.value)}
                    className="text-sm font-medium text-gray-800 border border-gray-300 rounded px-2 py-1 w-32"
                    autoFocus
                  />
                  <button
                    onClick={async () => {
                      if (!user || !shopNameInput.trim()) return;
                      setSavingProfile(true);
                      const token = localStorage.getItem('authToken');
                      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                      try {
                        const response = await fetch(`${apiUrl}/auth/profile`, {
                          method: 'PUT',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ shopName: shopNameInput.trim() })
                        });
                        if (response.ok) {
                          setUser(prev => prev ? { ...prev, shopName: shopNameInput.trim() } : null);
                          localStorage.setItem('userShopName', shopNameInput.trim());
                        }
                      } catch (err) {
                        console.error('Error updating profile:', err);
                      }
                      setSavingProfile(false);
                      setEditingShopName(false);
                    }}
                    disabled={savingProfile}
                    className="text-green-600 hover:text-green-800"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setEditingShopName(false);
                      setShopNameInput(user?.shopName || '');
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✗
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{user?.shopName || 'No disponible'}</span>
                  <button
                    onClick={() => {
                      setShopNameInput(user?.shopName || '');
                      setEditingShopName(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">Tipo de cuenta</span>
              <span className="text-sm font-medium text-gray-800 capitalize">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
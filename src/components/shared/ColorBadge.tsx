import { pageTypeLabels, pageTypeColors } from '../../utils/formatters';

interface Props {
  type: string;
  className?: string;
}

export function ColorBadge({ type, className = '' }: Props) {
  const colors = pageTypeColors[type] || pageTypeColors['bw'];
  const label = pageTypeLabels[type] || type;
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${colors} ${className}`}>
      {label}
    </span>
  );
}

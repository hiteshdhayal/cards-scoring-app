export function Avatar({
  name,
  index,
  size = 'md',
}: {
  name: string;
  index: number;
  size?: 'md' | 'sm';
}) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const colorClass = `avatar-${index % 6}`;
  return (
    <div className={`avatar ${size === 'sm' ? 'avatar-sm' : ''} ${colorClass}`}>{initial}</div>
  );
}

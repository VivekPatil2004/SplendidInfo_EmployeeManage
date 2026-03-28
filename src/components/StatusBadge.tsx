interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const statusConfig: Record<string, { color: string; bg: string; label: string; dot: string }> = {
  online:  { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200',  label: 'Online',  dot: 'bg-emerald-500' },
  away:    { color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',      label: 'Away',    dot: 'bg-amber-500' },
  busy:    { color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-200',        label: 'Busy',    dot: 'bg-rose-500' },
  offline: { color: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200',      label: 'Offline', dot: 'bg-slate-400' },
};

export default function StatusBadge({ status, size = 'md', showLabel = true }: StatusBadgeProps) {
  const cfg = statusConfig[status] || statusConfig.offline;
  const dotSizes = { sm: 'h-1.5 w-1.5', md: 'h-2 w-2', lg: 'h-2.5 w-2.5' };
  const textSizes = { sm: 'text-xs', md: 'text-xs', lg: 'text-sm' };

  if (!showLabel) {
    return (
      <span className={`inline-block rounded-full ${dotSizes[size]} ${cfg.dot} ${status === 'online' ? 'animate-pulse' : ''}`} />
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color} font-semibold ${textSizes[size]}`}>
      <span className={`rounded-full ${dotSizes[size]} ${cfg.dot} ${status === 'online' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
}

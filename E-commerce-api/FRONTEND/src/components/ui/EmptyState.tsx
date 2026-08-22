import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => (
  <div className="ui-surface flex flex-col items-center justify-center rounded-sm p-12 text-center space-y-3">
    {Icon && <Icon className="w-10 h-10 text-zinc-400" />}
    <p className="text-base font-bold text-zinc-100">{title}</p>
    {description && <p className="text-xs text-zinc-400 max-w-sm">{description}</p>}
    {action && <div className="pt-2">{action}</div>}
  </div>
);

export const SkeletonCard: React.FC = () => (
  <div className="h-72 ui-surface animate-pulse p-4 space-y-3">
    <div className="h-40 bg-zinc-800 rounded-xl" />
    <div className="h-4 bg-zinc-800 rounded w-3/4" />
    <div className="h-4 bg-zinc-800 rounded w-1/2" />
  </div>
);

export const SkeletonTableRow: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr className="border-b border-zinc-800">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-3 bg-zinc-800 rounded w-full animate-pulse" />
      </td>
    ))}
  </tr>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 4, cols = 5 }) => (
  <div className="w-full overflow-hidden rounded-sm border border-zinc-800">
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-zinc-100">
        <thead className="bg-zinc-900 border-b border-zinc-800">
          <tr>{Array.from({ length: cols }).map((_, i) => (<th key={i} className="px-4 py-3"><div className="h-3 bg-zinc-800 rounded w-20 animate-pulse" /></th>))}</tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => <SkeletonTableRow key={i} cols={cols} />)}
        </tbody>
      </table>
    </div>
  </div>
);

export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="h-3 bg-zinc-800 rounded animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
    ))}
  </div>
);

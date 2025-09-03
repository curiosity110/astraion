interface CapacityBarProps {
  used: number;
  total: number;
}

export default function CapacityBar({ used, total }: CapacityBarProps) {
  const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div className="w-full space-y-1">
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full bg-[var(--gradient-stellar)]"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <span className="text-xs text-gray-500">
        {used}/{total} seats
      </span>
    </div>
  );
}

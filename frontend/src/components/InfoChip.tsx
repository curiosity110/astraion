interface InfoChipProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const variants: Record<string, string> = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
};

export default function InfoChip({ label, variant = 'default' }: InfoChipProps) {
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>{label}</span>;
}

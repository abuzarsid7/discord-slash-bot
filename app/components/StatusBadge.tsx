import React from 'react';

type Status = 'success' | 'error' | 'warning' | 'info';

interface StatusBadgeProps {
  label: string;
  status?: Status;
}

const statusColors: Record<Status, string> = {
  success: 'bg-[#23a559]',
  error: 'bg-[#da373c]',
  warning: 'bg-[#f0b232]',
  info: 'bg-[#5865F2]',
};

export function StatusBadge({ label, status = 'success' }: StatusBadgeProps) {
  return (
    <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#1e1f22] border border-[#2b2d31]">
      <span className={`w-2.5 h-2.5 rounded-full mr-2 ${statusColors[status]}`} />
      <span className="text-sm font-medium text-gray-200">{label}</span>
    </div>
  );
}

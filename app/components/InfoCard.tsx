import React from 'react';

interface InfoCardProps {
  title: string;
  value: string | React.ReactNode;
  description?: React.ReactNode;
}

export function InfoCard({ title, value, description }: InfoCardProps) {
  return (
    <div className="bg-[#2b2d31] rounded-lg p-5 flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
        <div className="text-2xl font-bold text-gray-100">{value}</div>
      </div>
      {description && (
        <p className="text-xs text-gray-400 mt-3">{description}</p>
      )}
    </div>
  );
}

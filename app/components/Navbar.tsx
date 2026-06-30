import React from 'react';

export function Navbar() {
  return (
    <div className="h-14 bg-[#1e1f22] border-b border-[#111214] flex items-center justify-between px-6 flex-shrink-0">
      <div className="font-semibold text-gray-200">
        Slash Command Bot Admin
      </div>
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold text-sm">
          A
        </div>
      </div>
    </div>
  );
}

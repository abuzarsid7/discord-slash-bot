"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  ];

  return (
    <div className="w-64 bg-[#2b2d31] h-screen flex-shrink-0 border-r border-[#1e1f22] flex flex-col justify-between">
      <div>
        <div className="p-4 mb-4 border-b border-[#1e1f22]">
          <Link href="/">
            <div className="font-bold text-xl text-gray-100 cursor-pointer hover:text-[#5865F2] transition-colors">
              Bot Dashboard
            </div>
          </Link>
        </div>
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#404249] text-gray-100'
                      : 'text-gray-400 hover:bg-[#35373c] hover:text-gray-200'
                  }`}
                >
                  <svg
                    className={`w-5 h-5 mr-3 ${isActive ? 'text-gray-200' : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-[#1e1f22]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}

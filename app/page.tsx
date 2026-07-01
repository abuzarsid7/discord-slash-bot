import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#313338] text-[#f2f3f5] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-[#5865F2] selection:text-white font-sans">
      {/* Discord Profile Application Card */}
      <div className="max-w-md w-full bg-[#2b2d31] rounded-2xl border border-[#1e1f22] shadow-2xl overflow-hidden">
        {/* Profile Banner */}
        <div className="h-28 bg-gradient-to-r from-[#5865F2] via-[#4752c4] to-[#3b45a6] relative" />

        {/* Card Content Header */}
        <div className="px-6 pb-6 relative">
          {/* Floating Bot Avatar with Online Badge */}
          <div className="relative -mt-14 mb-4 flex items-end justify-between">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-[#313338] border-[6px] border-[#2b2d31] flex items-center justify-center shadow-md">
                <svg className="w-12 h-12 text-[#5865F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              {/* Discord Online Status Dot */}
              <div
                className="w-6 h-6 rounded-full bg-[#23a55a] border-[4px] border-[#2b2d31] absolute bottom-1 right-1"
                title="Online"
              />
            </div>
          </div>

          {/* Bot Title & App Tag */}
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Command Slash Bot
              </h1>
              {/* Official Discord APP Badge */}
              <span className="bg-[#5865F2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 uppercase tracking-wider select-none">
                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                App
              </span>
            </div>
            <p className="text-xs text-[#949ba4] font-medium mt-0.5 flex items-center gap-1.5">
              <span>Next.js 16</span>
              <span>&bull;</span>
              <span>PostgreSQL</span>
              <span>&bull;</span>
              <span className="text-[#23a55a] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#23a55a] animate-pulse" />
                Active Engine
              </span>
            </p>
          </div>

          {/* Discord 'ABOUT ME' Bio Section */}
          <div className="bg-[#1e1f22] p-4 rounded-xl border border-[#111214] mb-6">
            <h2 className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-2 select-none">
              About Me
            </h2>
            <p className="text-sm text-[#dbdee1] leading-relaxed">
              A high-performance Discord slash command engine. Automatically records interactions, triggers instant keyword alerts, and mirrors live webhook notifications to secondary channels.
            </p>
          </div>

          {/* Discord Style Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link href="/dashboard" className="w-full">
              <button className="w-full py-2.5 px-4 rounded font-medium bg-[#5865F2] hover:bg-[#4752c4] text-white transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer">
                <span>Launch Dashboard</span>
              </button>
            </Link>
            <a
              href="https://discord.com/developers/applications"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded font-medium bg-[#4e5058]/40 hover:bg-[#4e5058]/60 text-[#dbdee1] hover:text-white transition-colors text-sm flex items-center justify-center gap-2 text-center"
            >
              <span>Developer Portal</span>
              <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

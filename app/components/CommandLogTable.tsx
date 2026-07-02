import React from "react";
import { EmptyState } from "./EmptyState";

export interface LogEntry {
  id: number;
  interactionId: string;
  commandName: string;
  user: string;
  payloadText: string;
  flagged: boolean;
  errorLog: string | null;
  aiTriage: string | null;
  createdAt: Date;
}

export function CommandLogTable({ logs }: { logs: LogEntry[] }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="bg-[#2b2d31] rounded-xl border border-[#1e1f22] p-8 shadow-md">
        <EmptyState
          title="No slash commands logged yet."
          description="Try running /report or /status in your Discord server to populate the live log."
        />
      </div>
    );
  }

  return (
    <div className="bg-[#2b2d31] rounded-xl border border-[#1e1f22] overflow-hidden shadow-md">
      <div className="p-6 border-b border-[#1e1f22] flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#5865F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Live Command Logs (PostgreSQL)
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Real-time feed of incoming Discord webhook interactions and automated downstream quality bar checks.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-[#1e1f22] text-gray-300 text-xs font-mono font-medium border border-[#111214]">
          Total Records: {logs.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#1e1f22] text-xs uppercase text-gray-400 font-semibold border-b border-[#111214]">
            <tr>
              <th className="py-3.5 px-6">Command</th>
              <th className="py-3.5 px-6">User</th>
              <th className="py-3.5 px-6">Content / Payload</th>
              <th className="py-3.5 px-6">AI Triage</th>
              <th className="py-3.5 px-6">Rule Flag</th>
              <th className="py-3.5 px-6">Downstream Mirror</th>
              <th className="py-3.5 px-6">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1f22]">
            {logs.map((log) => {
              return (
                <tr key={log.id} className="hover:bg-[#35373c]/50 transition-colors">
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-xs font-medium bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20">
                      /{log.commandName}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-200 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#404249] flex items-center justify-center text-xs text-white font-bold">
                      {log.user ? log.user.charAt(0).toUpperCase() : "?"}
                    </div>
                    {log.user || "Unknown"}
                  </td>
                  <td className="py-4 px-6 max-w-xs truncate text-gray-300 font-mono text-xs">
                    {log.payloadText ? (
                      <span className="bg-[#1e1f22] px-2 py-1 rounded border border-[#111214] inline-block max-w-full truncate">
                        {log.payloadText}
                      </span>
                    ) : (
                      <span className="text-gray-500 italic">None</span>
                    )}
                  </td>
                  <td className="py-4 px-6 max-w-xs truncate text-xs">
                    {log.aiTriage ? (
                      <span className="bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20 px-2.5 py-1 rounded inline-block max-w-full truncate font-medium" title={log.aiTriage}>
                        🤖 {log.aiTriage}
                      </span>
                    ) : (
                      <span className="text-gray-500 italic">N/A</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {log.flagged ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Flagged Alert
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Normal
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {log.errorLog ? (
                      <span
                        title={log.errorLog}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 max-w-[160px] truncate"
                      >
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="truncate">Mirror Failed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Mirrored
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} &bull;{" "}
                    {new Date(log.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

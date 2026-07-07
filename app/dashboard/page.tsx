import React from "react";
import { prisma } from "@/lib/prisma";
import { InfoCard } from "../components/InfoCard";
import { StatusBadge } from "../components/StatusBadge";
import { ConfigForm } from "../components/ConfigForm";
import { CommandLogTable } from "../components/CommandLogTable";

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ guildId?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};

  // Fetch distinct guild IDs for the Multi-Server Switcher
  const [logGuilds, configGuilds] = await Promise.all([
    prisma.command_log.findMany({ select: { guildId: true }, distinct: ["guildId"] }),
    prisma.config.findMany({ select: { guildId: true }, distinct: ["guildId"] }),
  ]);
  const allGuilds = Array.from(
    new Set([
      "default",
      ...logGuilds.map((g) => g.guildId),
      ...configGuilds.map((c) => c.guildId),
    ])
  ).filter(Boolean);

  const selectedGuildId = resolvedParams?.guildId || allGuilds[0] || "default";

  // Scoped Data Fetching inside Next.js Server Component by guild_id
  const [logs, totalLogsCount, flaggedLogsCount, configRecord, mirrorRecord, pauseRecord] = await Promise.all([
    prisma.command_log.findMany({
      where: { guildId: selectedGuildId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.command_log.count({ where: { guildId: selectedGuildId } }),
    prisma.command_log.count({ where: { guildId: selectedGuildId, flagged: true } }),
    prisma.config.findUnique({ where: { guildId_key: { guildId: selectedGuildId, key: "flagged_keywords" } } }),
    prisma.config.findUnique({ where: { guildId_key: { guildId: selectedGuildId, key: "mirror_webhook_url" } } }),
    prisma.config.findUnique({ where: { guildId_key: { guildId: selectedGuildId, key: "commands_paused" } } }),
  ]);

  const activeKeywords = configRecord?.value || "urgent";
  const activeMirrorUrl = mirrorRecord?.value || process.env.DISCORD_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL || "";
  const isPaused = pauseRecord?.value === "true";
  const lastInteraction = logs[0] ? `/${logs[0].commandName} by ${logs[0].user}` : "None yet";

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e1f22] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">System Overview & Live Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time analytics, trigger rules configuration, and live Discord webhook logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge label="Postgres Connected" status="success" />
          <StatusBadge label="Multi-Server Isolated" status="info" />
        </div>
      </div>

      {isPaused && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold text-sm text-amber-200">Maintenance Mode Active</p>
              <p className="text-xs text-amber-300/80 mt-0.5">
                All slash commands are currently PAUSED for this server scope (<code className="font-mono bg-amber-500/20 px-1 py-0.5 rounded text-amber-100">{selectedGuildId}</code>). Interactive buttons and modals remain functional.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Server Isolation Selector Bar */}
      <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#1e1f22] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Active Server Scope:</span>
          <span className="px-3 py-1 rounded bg-[#5865F2]/10 text-[#5865F2] font-mono text-sm font-bold border border-[#5865F2]/20">
            {selectedGuildId === "default" ? "Global / Default" : `Guild: ${selectedGuildId}`}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">Switch Server Scope:</span>
          {allGuilds.map((gid) => (
            <a
              key={gid}
              href={`/dashboard?guildId=${gid}`}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                gid === selectedGuildId
                  ? "bg-[#5865F2] text-white font-semibold shadow-sm"
                  : "bg-[#1e1f22] text-gray-300 hover:bg-[#35373c] border border-[#111214]"
              }`}
            >
              {gid === "default" ? "Default Scope" : gid}
            </a>
          ))}
        </div>
      </div>
      
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InfoCard
          title="Total Commands Logged"
          value={<span className="text-2xl font-bold text-gray-100 font-mono">{totalLogsCount}</span>}
          description="All verified webhooks saved in Postgres."
        />
        
        <InfoCard
          title="Flagged Alerts"
          value={
            <span className={`text-2xl font-bold font-mono ${flaggedLogsCount > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {flaggedLogsCount}
            </span>
          }
          description="Commands matching keyword trigger rules."
        />
        
        <InfoCard
          title="Last Interaction"
          value={<span className="text-lg font-mono text-[#5865F2] truncate block">{lastInteraction}</span>}
          description={logs[0] ? new Date(logs[0].createdAt).toLocaleTimeString() : "Waiting for webhooks"}
        />
        
        <InfoCard
          title="Interaction Endpoint"
          value={<span className="text-lg font-mono text-gray-300">/api/interactions</span>}
          description={<span className="text-[#23a559] font-medium">Type 5 Deferral Active</span>}
        />
      </div>

      {/* Configuration Form */}
      <ConfigForm
        guildId={selectedGuildId}
        initialKeywords={activeKeywords}
        initialMirrorUrl={activeMirrorUrl}
        initialCommandsPaused={isPaused}
      />

      {/* Live Command Log Table */}
      <CommandLogTable logs={logs} />
    </div>
  );
}

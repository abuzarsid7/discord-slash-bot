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
  const [logs, totalLogsCount, flaggedLogsCount, configRecord, mirrorRecord] = await Promise.all([
    prisma.command_log.findMany({
      where: { guildId: selectedGuildId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.command_log.count({ where: { guildId: selectedGuildId } }),
    prisma.command_log.count({ where: { guildId: selectedGuildId, flagged: true } }),
    prisma.config.findUnique({ where: { guildId_key: { guildId: selectedGuildId, key: "flagged_keywords" } } }),
    prisma.config.findUnique({ where: { guildId_key: { guildId: selectedGuildId, key: "mirror_webhook_url" } } }),
  ]);

  const activeKeywords = configRecord?.value || "urgent";
  const activeMirrorUrl = mirrorRecord?.value || process.env.DISCORD_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL || "";
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
      />

      {/* Live Command Log Table */}
      <CommandLogTable logs={logs} />
    </div>
  );
}

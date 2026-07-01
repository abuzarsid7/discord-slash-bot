import React from "react";
import { prisma } from "@/lib/prisma";
import { InfoCard } from "../components/InfoCard";
import { StatusBadge } from "../components/StatusBadge";
import { ConfigForm } from "../components/ConfigForm";
import { CommandLogTable } from "../components/CommandLogTable";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Direct Data Fetching inside Next.js Server Component
  const [logs, totalLogsCount, flaggedLogsCount, configRecord, mirrorRecord] = await Promise.all([
    prisma.command_log.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.command_log.count(),
    prisma.command_log.count({ where: { flagged: true } }),
    prisma.config.findUnique({ where: { key: "flagged_keywords" } }),
    prisma.config.findUnique({ where: { key: "mirror_webhook_url" } }),
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
          <StatusBadge label="SLA < 3s Active" status="info" />
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
      <ConfigForm initialKeywords={activeKeywords} initialMirrorUrl={activeMirrorUrl} />

      {/* Live Command Log Table */}
      <CommandLogTable logs={logs} />
    </div>
  );
}

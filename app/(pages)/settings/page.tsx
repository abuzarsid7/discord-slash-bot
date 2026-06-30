import React from "react";
import { InfoCard } from "../../components/InfoCard";
import { StatusBadge } from "../../components/StatusBadge";

export default function SettingsPage() {
  const hasPublicKey = !!process.env.DISCORD_PUBLIC_KEY;
  const hasBotToken = !!process.env.DISCORD_BOT_TOKEN;
  const hasAppId = !!process.env.DISCORD_APPLICATION_ID;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-100">Settings</h1>
      
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-200">Environment Variables</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoCard
            title="DISCORD_PUBLIC_KEY"
            value={
              hasPublicKey ? (
                <StatusBadge label="Configured" status="success" />
              ) : (
                <StatusBadge label="Missing" status="error" />
              )
            }
            description="Required to verify signatures from Discord."
          />
          
          <InfoCard
            title="DISCORD_APPLICATION_ID"
            value={
              hasAppId ? (
                <StatusBadge label="Configured" status="success" />
              ) : (
                <StatusBadge label="Missing" status="warning" />
              )
            }
            description="Used to register commands and identify your app."
          />

          <InfoCard
            title="DISCORD_BOT_TOKEN"
            value={
              hasBotToken ? (
                <StatusBadge label="Configured" status="success" />
              ) : (
                <StatusBadge label="Missing" status="warning" />
              )
            }
            description="Used to authenticate API requests to Discord."
          />
        </div>
      </div>
    </div>
  );
}

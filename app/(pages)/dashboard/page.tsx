import React from "react";
import { InfoCard } from "../../components/InfoCard";
import { StatusBadge } from "../../components/StatusBadge";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-100">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InfoCard
          title="Bot Status"
          value={<StatusBadge label="Online" status="success" />}
          description="The bot backend is currently running and ready to accept interactions."
        />
        
        <InfoCard
          title="Interaction Endpoint"
          value={<span className="text-xl font-mono text-gray-300">/api/interactions</span>}
          description={<span className="text-[#23a559] font-medium">Status: Ready</span>}
        />
        
        <InfoCard
          title="Last Interaction"
          value="None yet"
          description="Waiting for Discord to send a PING or Slash Command."
        />
        
        <InfoCard
          title="Registered Commands"
          value="0"
          description="No global or guild commands synced yet."
        />
        
        <InfoCard
          title="Environment"
          value={<StatusBadge label="Development" status="info" />}
          description="Running in local development mode."
        />
      </div>
    </div>
  );
}

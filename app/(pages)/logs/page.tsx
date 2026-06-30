import React from "react";
import { EmptyState } from "../../components/EmptyState";

export default function LogsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-100">Interaction Logs</h1>
      <div className="bg-[#2b2d31] rounded-lg border border-[#1e1f22]">
        <EmptyState
          title="No interactions received yet."
          description="Later this page will show slash command logs and incoming Discord webhooks."
        />
      </div>
    </div>
  );
}

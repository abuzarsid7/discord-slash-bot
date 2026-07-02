"use client";

import React, { useState, useTransition } from "react";
import { updateConfig } from "../actions/config";

export function ConfigForm({
  guildId = "default",
  initialKeywords,
  initialMirrorUrl,
}: {
  guildId?: string;
  initialKeywords: string;
  initialMirrorUrl?: string;
}) {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [mirrorUrl, setMirrorUrl] = useState(initialMirrorUrl || "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaved(false);
    const formData = new FormData();
    formData.append("guildId", guildId);
    formData.append("keywords", keywords);
    formData.append("mirrorUrl", mirrorUrl);

    startTransition(async () => {
      await updateConfig(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  const isUnchanged = keywords === initialKeywords && mirrorUrl === (initialMirrorUrl || "");

  return (
    <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1e1f22] shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#5865F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            System & Notification Rules ({guildId === "default" ? "Default Scope" : `Guild: ${guildId}`})
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Configure dynamic trigger rules and real-time webhook notification mirrors isolated for this server.
          </p>
        </div>
        {saved && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved to Postgres
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trigger Keywords Input */}
        <div>
          <label htmlFor="keywords" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Trigger Flag Keywords
          </label>
          <input
            id="keywords"
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="urgent, emergency, alert, bug, exploit"
            className="w-full px-4 py-3 rounded-lg bg-[#1e1f22] border border-[#111214] text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2] transition-colors font-mono text-sm"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Comma-separated words that automatically flag <code className="text-[#5865F2] bg-[#1e1f22] px-1 py-0.5 rounded">/report</code> webhooks.
          </p>
        </div>

        {/* Mirror Webhook URL Input */}
        <div>
          <label htmlFor="mirrorUrl" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Mirror Channel Webhook URL</span>
            <span className="text-[10px] text-[#5865F2] font-normal lowercase bg-[#5865F2]/10 px-2 py-0.5 rounded">Discord Webhook</span>
          </label>
          <input
            id="mirrorUrl"
            type="url"
            value={mirrorUrl}
            onChange={(e) => setMirrorUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/123456789/abc..."
            className="w-full px-4 py-3 rounded-lg bg-[#1e1f22] border border-[#111214] text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2] transition-colors font-mono text-sm"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Paste a Discord Channel Webhook URL to instantly mirror live command notifications to your secondary channel.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#1e1f22]">
          <p className="text-xs text-gray-500">
            Stored in <code className="text-gray-400">config</code> table &bull; Instant live revalidation
          </p>
          <button
            type="submit"
            disabled={isPending || isUnchanged}
            className="px-5 py-2.5 bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Updating Configuration...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

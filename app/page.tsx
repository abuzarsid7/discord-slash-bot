import Link from "next/link";
import { StatusBadge } from "./components/StatusBadge";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#313338]">
      <div className="max-w-2xl w-full bg-[#2b2d31] p-10 rounded-2xl shadow-lg border border-[#1e1f22]">
        <h1 className="text-4xl font-bold text-gray-100 mb-4">
          Discord Slash Command Bot
        </h1>
        
        <p className="text-gray-400 mb-8 text-lg">
          A minimal Next.js application designed to handle Discord Interaction Webhooks.
          Currently serving as an MVP to verify endpoint connectivity.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <StatusBadge label="Backend Running" status="success" />
          <StatusBadge label="Discord Endpoint Ready" status="success" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <button className="px-6 py-3 rounded-md font-medium bg-[#5865F2] hover:bg-[#4752c4] text-white transition-colors w-full sm:w-auto">
              Go to Dashboard
            </button>
          </Link>
          <a
            href="https://discord.com/developers/applications"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-md font-medium bg-[#404249] hover:bg-[#4e5058] text-gray-200 transition-colors w-full sm:w-auto"
          >
            Discord Developer Portal
          </a>
        </div>
      </div>
    </div>
  );
}

import { verifyKey, InteractionType, InteractionResponseType } from 'discord-interactions';
import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function POST(req: Request) {
  // Get headers for verification
  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');
  
  // We need the raw body as a string to verify the signature
  const rawBody = await req.text();

  if (!signature || !timestamp) {
    return new Response('Missing signature or timestamp', { status: 401 });
  }

  // Ensure DISCORD_PUBLIC_KEY is set in your environment variables (.env.local)
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    return new Response('Server configuration error: missing public key', { status: 500 });
  }

  // Verify the request signature
  const isValidRequest = await verifyKey(rawBody, signature, timestamp, publicKey);

  if (!isValidRequest) {
    return new Response('Invalid request signature', { status: 401 });
  }

  // Parse the verified message body
  const message = JSON.parse(rawBody);

  if (message.type === InteractionType.PING) {
    return new Response(JSON.stringify({ type: InteractionResponseType.PONG }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (message.type === InteractionType.APPLICATION_COMMAND) {
    const { name, options } = message.data;
    const interactionId = message.id;
    const token = message.token;
    const username = message.member?.user?.username || 'Unknown User';
    
    let replyMessage = "Command received!";
    let flagged = false;
    let reportText = "";

    // Handle /report command
    if (name === 'report') {
      reportText = options?.find((opt: any) => opt.name === 'text')?.value || "";
      
      // Apply a trivial rule: flag if text contains "urgent"
      if (reportText.toLowerCase().includes("urgent")) {
        flagged = true;
        replyMessage = "🚨 Urgent report logged. Admins have been notified.";
      } else {
        replyMessage = "Report logged successfully.";
      }
    } 
    // Handle /status command
    else if (name === 'status') {
      replyMessage = "Bot is online and tracking interactions! 🟢";
    }

    // 1. Return Type 5 Deferred Acknowledgment IMMEDIATELY (< 20ms) to beat Discord's 3-second clock!
    // This displays "Bot is thinking..." in Discord and grants a 15-minute SLA for slow downstream tasks.
    const deferredResponse = NextResponse.json({
      type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE // Type 5
    });

    // 2. Run database logging, Slack mirroring, and Discord message follow-up asynchronously in the background
    (async () => {
      try {
        // Write to Postgres first (Memory Preservation & Deduplication check via @unique constraint)
        await prisma.command_log.create({
          data: {
            interactionId: interactionId,
            commandName: name,
            user: username,
            payloadText: reportText,
            flagged: flagged
          }
        });

        // Notify Slack mirror channel if configured
        if (process.env.SLACK_WEBHOOK_URL) {
          fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `*New Command Used:* \`/${name}\` by ${username}\n*Flagged:* ${flagged}\n*Content:* ${reportText || "N/A"}`
            })
          })
            .then(async (res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            })
            .catch((error) => {
              console.error("Slack mirror failed:", error);
              // Log downstream failure directly to the database row
              prisma.command_log.update({
                where: { interactionId: interactionId },
                data: { errorLog: `Slack mirror failed: ${error.message || error}` }
              }).catch((e) => console.error("Failed to update DB error log:", e));
            });
        }
      } catch (error: any) {
        // If duplicate webhook arrived, Postgres throws P2002 unique constraint error.
        if (error?.code === 'P2002') {
          console.log(`Duplicate interaction ID ${interactionId} detected in background. No-op.`);
          replyMessage = "⚠️ Duplicate command ignored (No-op).";
        } else {
          console.error("Database error during command logging:", error);
          replyMessage = "❌ An error occurred while logging your command.";
        }
      } finally {
        // 3. Use Discord's Edit Original Interaction endpoint (@original) to replace "Bot is thinking..." with the actual reply!
        if (process.env.DISCORD_APP_ID && token) {
          const editUrl = `https://discord.com/api/v10/webhooks/${process.env.DISCORD_APP_ID}/${token}/messages/@original`;
          fetch(editUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: replyMessage })
          }).catch((e) => console.error("Failed to edit original interaction message:", e));
        }
      }
    })();

    return deferredResponse;
  }

  return new Response('Unknown interaction type', { status: 400 });
}

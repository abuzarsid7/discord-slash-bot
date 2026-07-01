import { verifyKey, InteractionType, InteractionResponseType } from 'discord-interactions';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

    if (name === 'report') {
      reportText = options?.find((opt: any) => opt.name === 'text')?.value || "";
    }

    // 1. Return Type 5 Deferred Acknowledgment IMMEDIATELY (< 20ms) to beat Discord's 3-second clock!
    // This displays "Bot is thinking..." in Discord and grants a 15-minute SLA for slow downstream tasks.
    const deferredResponse = NextResponse.json({
      type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE // Type 5
    });

    // 2. Run database logging, Slack mirroring, and Discord message follow-up asynchronously in the background
    (async () => {
      try {
        // Fetch dynamic flagged keywords and mirror webhook URL from DB Config table
        const [configRecord, mirrorRecord] = await Promise.all([
          prisma.config.findUnique({ where: { key: 'flagged_keywords' } }),
          prisma.config.findUnique({ where: { key: 'mirror_webhook_url' } })
        ]);
        const keywordsStr = configRecord?.value || "urgent";
        const keywords = keywordsStr.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);
        const dbMirrorUrl = mirrorRecord?.value?.trim();
        const envDiscordUrl = (process.env.DISCORD_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL)?.trim();
        const urlsToNotify = Array.from(new Set([dbMirrorUrl, envDiscordUrl].filter(Boolean) as string[]));

        if (name === 'report') {
          const isFlagged = keywords.some((kw: string) => reportText.toLowerCase().includes(kw));
          if (isFlagged) {
            flagged = true;
            replyMessage = `🚨 Flagged report logged. Admins have been notified.`;
          } else {
            replyMessage = "Report logged successfully.";
          }
        } else if (name === 'status') {
          replyMessage = "Bot is online and tracking interactions! 🟢";
        }

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

        // Notify all configured Mirror Channels (Discord Webhooks)
        if (urlsToNotify.length > 0) {
          const notifyText = `**New Command Used:** \`/${name}\` by ${username}\n**Flagged:** ${flagged}\n**Content:** ${reportText || "N/A"}`;
          const payload = JSON.stringify({
            content: notifyText, // For Discord channel webhooks
            text: notifyText     // Fallback for Slack webhooks
          });

          urlsToNotify.forEach((url) => {
            fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payload
            })
              .then(async (res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
              })
              .catch((error) => {
                console.error(`Mirror webhook failed (${url}):`, error);
                // Log downstream failure directly to the database row
                prisma.command_log.update({
                  where: { interactionId: interactionId },
                  data: { errorLog: `Mirror failed (${url.slice(0, 25)}...): ${error.message || error}` }
                }).catch((e) => console.error("Failed to update DB error log:", e));
              });
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

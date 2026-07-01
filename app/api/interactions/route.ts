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
    const username = message.member?.user?.username || 'Unknown User';
    
    // Deduplicate incoming payloads using the interaction id so your app does not do the same thing twice
    const existingLog = await prisma.command_log.findUnique({ where: { interactionId } });
    if (existingLog) {
       return NextResponse.json({ error: 'Duplicate interaction' }, { status: 400 });
    }

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

    // Write the interaction to a command_logs table
    await prisma.command_log.create({
      data: {
        interactionId: interactionId,
        commandName: name,
        user: username,
        payloadText: reportText,
        flagged: flagged
      }
    });

    // POST to the Slack webhook to mirror
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `*New Command Used:* \`/${name}\` by ${username}\n*Flagged:* ${flagged}\n*Content:* ${reportText || "N/A"}`
          })
        });
      } catch (error) {
        console.error("Slack mirror failed, but Discord response should proceed", error);
      }
    }

    // Respond back in Discord
    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, // Type 4
      data: {
        content: replyMessage
      }
    });
  }

  return new Response('Unknown interaction type', { status: 400 });
}

import { InteractionResponseType, MessageComponentTypes, ButtonStyleTypes, TextStyleTypes } from 'discord-interactions';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyMirrorWebhooks, editOriginalInteraction } from '@/services/webhooks';
import { triageWithAI } from '@/services/ai';

export async function handleApplicationCommand(message: any) {
  const { name, options } = message.data;
  const interactionId = message.id;
  const token = message.token;
  const username = message.member?.user?.username || message.user?.username || 'Unknown User';
  const guildId = message.guild_id || 'default';
  
  let replyMessage = "Command received!";
  let replyComponents: any[] | undefined = undefined;
  let flagged = false;
  let reportText = "";

  if (name === 'report') {
    reportText = options?.find((opt: any) => opt.name === 'text')?.value || "";
  }

  // If /feedback is called, or if /report is called without text, open an interactive modal dialog form!
  if (name === 'feedback' || (name === 'report' && !reportText)) {
    return NextResponse.json({
      type: InteractionResponseType.MODAL,
      data: {
        custom_id: name === 'feedback' ? 'feedback_modal' : 'report_modal',
        title: name === 'feedback' ? 'Submit Feedback Dialog' : 'Submit Issue Report Dialog',
        components: [
          {
            type: MessageComponentTypes.ACTION_ROW,
            components: [
              {
                type: MessageComponentTypes.INPUT_TEXT,
                custom_id: name === 'feedback' ? 'feedback_title' : 'report_title',
                label: 'Title / Subject',
                style: TextStyleTypes.SHORT,
                min_length: 3,
                max_length: 100,
                placeholder: 'e.g., Feature request or bug title',
                required: true
              }
            ]
          },
          {
            type: MessageComponentTypes.ACTION_ROW,
            components: [
              {
                type: MessageComponentTypes.INPUT_TEXT,
                custom_id: name === 'feedback' ? 'feedback_details' : 'report_details',
                label: 'Detailed Description',
                style: TextStyleTypes.PARAGRAPH,
                min_length: 10,
                max_length: 1000,
                placeholder: 'Provide detailed explanation, steps to reproduce, or feedback...',
                required: true
              }
            ]
          }
        ]
      }
    });
  }

  // 1. Return Type 5 Deferred Acknowledgment IMMEDIATELY (< 20ms) to beat Discord's 3-second clock!
  const deferredResponse = NextResponse.json({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE // Type 5
  });

  // 2. Run database logging, AI Triage, Slack mirroring, and Discord message follow-up asynchronously in background
  (async () => {
    try {
      const configRecord = await prisma.config.findUnique({
        where: { guildId_key: { guildId, key: 'flagged_keywords' } }
      });
      const keywordsStr = configRecord?.value || "urgent";
      const keywords = keywordsStr.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);

      let aiTriage: string | null = null;

      if (name === 'report') {
        // Run AI triage on the report text using free Gemini/Groq API (or simulation fallback)
        aiTriage = await triageWithAI(reportText);

        const isFlagged = keywords.some((kw: string) => reportText.toLowerCase().includes(kw));
        if (isFlagged) {
          flagged = true;
          replyMessage = `🚨 **Flagged report logged!** Admins have been notified.\n\n🤖 **AI Triage:**\n> ${aiTriage}`;
        } else {
          replyMessage = `✅ **Report logged successfully.**\n\n🤖 **AI Triage:**\n> ${aiTriage}`;
        }
        replyComponents = [
          {
            type: MessageComponentTypes.ACTION_ROW,
            components: [
              {
                type: MessageComponentTypes.BUTTON,
                custom_id: `ack_report_${interactionId}`,
                label: 'Acknowledge Report ✅',
                style: ButtonStyleTypes.SUCCESS
              },
              {
                type: MessageComponentTypes.BUTTON,
                custom_id: `dismiss_report_${interactionId}`,
                label: 'Dismiss ❌',
                style: ButtonStyleTypes.DANGER
              }
            ]
          }
        ];
      } else if (name === 'status') {
        replyMessage = "Bot is online and tracking interactions! 🟢";
        replyComponents = [
          {
            type: MessageComponentTypes.ACTION_ROW,
            components: [
              {
                type: MessageComponentTypes.BUTTON,
                custom_id: 'refresh_status',
                label: 'Refresh Status 🔄',
                style: ButtonStyleTypes.PRIMARY
              },
              {
                type: MessageComponentTypes.BUTTON,
                custom_id: 'ping_bot',
                label: 'Ping Bot 🏓',
                style: ButtonStyleTypes.SECONDARY
              },
              {
                type: MessageComponentTypes.BUTTON,
                custom_id: 'open_feedback_modal',
                label: 'Submit Feedback 📝',
                style: ButtonStyleTypes.PRIMARY
              }
            ]
          }
        ];
      }

      // 1. Instantly update Discord UI so user never waits on DB inserts or webhook mirrors!
      await editOriginalInteraction(token, replyMessage, replyComponents);

      // 2. Log to database in background
      await prisma.command_log.create({
        data: {
          interactionId: interactionId,
          guildId: guildId,
          commandName: name,
          user: username,
          payloadText: reportText,
          flagged: flagged,
          aiTriage: aiTriage
        }
      });

      // 3. Mirror notifications in background
      const notifyText = `**New Command Used:** \`/${name}\` by ${username}\n**Flagged:** ${flagged}\n**AI Triage:** ${aiTriage || "N/A"}\n**Content:** ${reportText || "N/A"}`;
      await notifyMirrorWebhooks(guildId, notifyText, interactionId);

    } catch (error: any) {
      if (error?.code === 'P2002') {
        console.log(`Duplicate interaction ID ${interactionId} detected in background. No-op.`);
      } else {
        console.error("Database error during command logging:", error);
        await editOriginalInteraction(token, "❌ An error occurred while processing your command.");
      }
    }
  })();

  return deferredResponse;
}

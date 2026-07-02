import { InteractionResponseType, MessageComponentTypes, ButtonStyleTypes } from 'discord-interactions';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyMirrorWebhooks, editOriginalInteraction } from '@/services/webhooks';
import { triageWithAI } from '@/services/ai';

export async function handleModalSubmit(message: any) {
  const { custom_id } = message.data;
  const interactionId = message.id;
  const token = message.token;
  const username = message.member?.user?.username || message.user?.username || 'Unknown User';

  // Parse form fields from Action Rows
  const fields: Record<string, string> = {};
  for (const row of message.data?.components || []) {
    for (const comp of row.components || []) {
      if (comp.custom_id && comp.value !== undefined) {
        fields[comp.custom_id] = comp.value;
      }
    }
  }

  const title = fields['report_title'] || fields['feedback_title'] || 'Untitled Report';
  const details = fields['report_details'] || fields['feedback_details'] || 'No details provided.';
  const fullText = `**Title:** ${title}\n**Details:** ${details}`;

  // 1. Return Type 5 Deferred Acknowledgment IMMEDIATELY (< 20ms) to beat Discord's 3-second clock during LLM inference!
  const deferredResponse = NextResponse.json({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE // Type 5
  });

  // 2. Asynchronously run AI Triage, save to Postgres, notify mirror webhooks, and edit the Discord response
  (async () => {
    let replyContent = `📋 **Modal Report Submitted by ${username}!**\n\n**Title:** ${title}\n**Details:** ${details}`;
    const replyComponents = [
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

    try {
      // Run AI triage on form contents
      const aiTriage = await triageWithAI(`${title}: ${details}`);
      replyContent += `\n\n🤖 **AI Triage:**\n> ${aiTriage}`;

      const configRecord = await prisma.config.findUnique({ where: { key: 'flagged_keywords' } });
      const keywordsStr = configRecord?.value || "urgent";
      const keywords = keywordsStr.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);
      const isFlagged = keywords.some((kw: string) => fullText.toLowerCase().includes(kw));

      await prisma.command_log.create({
        data: {
          interactionId: interactionId,
          commandName: `modal:${custom_id}`,
          user: username,
          payloadText: fullText,
          flagged: isFlagged,
          aiTriage: aiTriage
        }
      });

      const notifyText = `**New Modal Submitted:** \`${custom_id}\` by ${username}\n**Flagged:** ${isFlagged}\n**AI Triage:** ${aiTriage}\n${fullText}`;
      await notifyMirrorWebhooks(notifyText);
    } catch (error: any) {
      if (error?.code !== 'P2002') {
        console.error("Database error logging modal submission:", error);
      }
      replyContent += `\n\n⚠️ *(Note: Background processing encountered an error)*`;
    } finally {
      await editOriginalInteraction(token, replyContent, replyComponents);
    }
  })();

  return deferredResponse;
}

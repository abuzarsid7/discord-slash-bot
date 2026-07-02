import { InteractionResponseType, MessageComponentTypes, ButtonStyleTypes } from 'discord-interactions';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyMirrorWebhooks } from '@/services/webhooks';

export async function handleModalSubmit(message: any) {
  const { custom_id } = message.data;
  const interactionId = message.id;
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

  // 1. Asynchronously save to Postgres and notify mirror webhooks without blocking the immediate response
  (async () => {
    try {
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
          flagged: isFlagged
        }
      });

      const notifyText = `**New Modal Submitted:** \`${custom_id}\` by ${username}\n**Flagged:** ${isFlagged}\n${fullText}`;
      await notifyMirrorWebhooks(notifyText);
    } catch (error: any) {
      if (error?.code !== 'P2002') {
        console.error("Database error logging modal submission:", error);
      }
    }
  })();

  // 2. Return Type 4 confirmation message with admin review buttons!
  return NextResponse.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `📋 **Modal Report Submitted by ${username}!**\n\n**Title:** ${title}\n**Details:** ${details}`,
      components: [
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
      ]
    }
  });
}

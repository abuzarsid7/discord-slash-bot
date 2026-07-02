import { InteractionResponseType, MessageComponentTypes, ButtonStyleTypes, TextStyleTypes } from 'discord-interactions';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function handleMessageComponent(message: any) {
  const { custom_id } = message.data;
  const interactionId = message.id;
  const username = message.member?.user?.username || message.user?.username || 'Unknown User';
  const guildId = message.guild_id || 'default';

  // Log the button click asynchronously without blocking the immediate Discord reply
  (async () => {
    try {
      await prisma.command_log.create({
        data: {
          interactionId: interactionId,
          guildId: guildId,
          commandName: `button:${custom_id.split('_')[0]}`,
          user: username,
          payloadText: `Clicked component: ${custom_id}`,
          flagged: false
        }
      });
    } catch (error: any) {
      if (error?.code !== 'P2002') {
        console.error("Database error logging button click:", error);
      }
    }
  })();

  if (custom_id === 'refresh_status') {
    return NextResponse.json({
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: {
        content: `Bot status refreshed by **${username}**! All systems operational 🟢 (Updated: ${new Date().toLocaleTimeString()})`,
        components: [
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
        ]
      }
    });
  }

  if (custom_id === 'ping_bot') {
    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `🏓 Pong! Button clicked by **${username}** at ${new Date().toLocaleTimeString()}!`,
        flags: 64
      }
    });
  }

  if (custom_id === 'open_feedback_modal') {
    return NextResponse.json({
      type: InteractionResponseType.MODAL,
      data: {
        custom_id: 'feedback_modal',
        title: 'Submit Feedback Dialog',
        components: [
          {
            type: MessageComponentTypes.ACTION_ROW,
            components: [
              {
                type: MessageComponentTypes.INPUT_TEXT,
                custom_id: 'feedback_title',
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
                custom_id: 'feedback_details',
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

  if (custom_id.startsWith('ack_report_')) {
    return NextResponse.json({
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: {
        content: `✅ Report acknowledged and processed by **${username}**!`,
        components: [
          {
            type: MessageComponentTypes.ACTION_ROW,
            components: [
              {
                type: MessageComponentTypes.BUTTON,
                custom_id: 'acknowledged_done',
                label: `Acknowledged by ${username} ✅`,
                style: ButtonStyleTypes.SUCCESS,
                disabled: true
              }
            ]
          }
        ]
      }
    });
  }

  if (custom_id.startsWith('dismiss_report_')) {
    return NextResponse.json({
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: {
        content: `❌ Report dismissed by **${username}**.`,
        components: [
          {
            type: MessageComponentTypes.ACTION_ROW,
            components: [
              {
                type: MessageComponentTypes.BUTTON,
                custom_id: 'dismissed_done',
                label: `Dismissed by ${username} ❌`,
                style: ButtonStyleTypes.DANGER,
                disabled: true
              }
            ]
          }
        ]
      }
    });
  }

  // Default fallback component response
  return NextResponse.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `Button interaction \`${custom_id}\` processed for **${username}**!`,
      flags: 64
    }
  });
}

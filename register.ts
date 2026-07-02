require('dotenv').config();

const APP_ID = process.env.DISCORD_APP_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const commands = [
  {
    name: 'report',
    description: 'Report an issue (leave blank to open interactive dialog form)',
    contexts: [0, 1, 2], // 0: Guild, 1: Bot DM, 2: Private Channel
    integration_types: [0, 1], // 0: Guild Install, 1: User Install
    options: [
      {
        name: 'text',
        description: 'Optional summary (leave blank to use multi-step modal dialog)',
        type: 3, // Type 3 is STRING
        required: false,
      },
    ],
  },
  {
    name: 'feedback',
    description: 'Submit multi-step feedback or bug report via an interactive popup form',
    contexts: [0, 1, 2],
    integration_types: [0, 1],
  },
  {
    name: 'status',
    description: 'Check the bot\'s current status',
    contexts: [0, 1, 2],
    integration_types: [0, 1],
  },
];

async function registerCommands() {
  const globalUrl = `https://discord.com/api/v10/applications/${APP_ID}/commands`;
  const guildUrl = `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`;

  try {
    // 1. Register Global Commands (enables commands in DMs and across ALL multi-server guilds)
    console.log('⏳ Registering Global commands (for DMs & Multi-Server support)...');
    const globalRes = await fetch(globalUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });

    if (globalRes.ok) {
      console.log('✅ Successfully registered Global slash commands (enabled in DMs & all servers)!');
    } else {
      const errorText = await globalRes.text();
      console.error('❌ Failed to register Global commands:', errorText);
    }

    // 2. Register Guild Commands (for immediate propagation in dev guild)
    if (GUILD_ID) {
      console.log(`⏳ Registering Guild commands for dev guild ${GUILD_ID}...`);
      const guildRes = await fetch(guildUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commands),
      });

      if (guildRes.ok) {
        console.log('✅ Successfully registered Guild slash commands!');
      } else {
        const errorText = await guildRes.text();
        console.error('❌ Failed to register Guild commands:', errorText);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

registerCommands();
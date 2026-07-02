require('dotenv').config();

const APP_ID = process.env.DISCORD_APP_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const commands = [
  {
    name: 'report',
    description: 'Report an issue (leave blank to open interactive dialog form)',
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
  },
  {
    name: 'status',
    description: 'Check the bot\'s current status',
  },
];

async function registerCommands() {
  const url = `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`;

  try {
    const response = await fetch(url, {
      method: 'PUT', // Overwrites existing commands
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });

    if (response.ok) {
      console.log('✅ Successfully registered guild slash commands!');
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to register commands:', errorText);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

registerCommands();
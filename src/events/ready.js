import { Events } from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,
  /**
   * @param {import("discord.js").Client} client
   */
  async execute(client) {
    console.info(`[Discord] Logged in as ${client.user?.tag}`);
  },
};

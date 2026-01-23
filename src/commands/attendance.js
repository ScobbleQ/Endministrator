import { MessageFlags, SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('attendance')
    .setDescription('Attendance to SKPort')
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @returns {Promise<void>}
   */
  async execute(interaction) {
    // Need: cred, sign, uid,
    await interaction.reply({ content: 'Coming soon...', flags: [MessageFlags.Ephemeral] });
  },
};

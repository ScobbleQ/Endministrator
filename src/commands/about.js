import { MessageFlags, SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('about').setDescription('About the bot'),
  /** @param {import("discord.js").ChatInputCommandInteraction} interaction */
  async execute(interaction) {
    await interaction.reply({
      content: 'Coming soon...\nhttps://discord.gg/5rUsSZTyf2',
      flags: [MessageFlags.Ephemeral],
    });
  },
};

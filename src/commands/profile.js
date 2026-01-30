import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { BotConfig } from '../../config.js';
import { createEvent, getUser } from '../db/queries.js';
import { MessageTone, noUserContainer } from '../utils/containers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Get your profile information')
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @returns {Promise<void>}
   */
  async execute(interaction) {
    const user = await getUser(interaction.user.id);
    if (!user) {
      await interaction.reply({
        components: [noUserContainer({ tone: MessageTone.Formal })],
        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
      });
      return;
    }

    if (BotConfig.environment === 'production') {
      await createEvent(interaction.user.id, {
        interaction: 'discord',
        metadata: {
          type: 'slash',
          command: 'profile',
          timestamp: Date.now(),
        },
      });
    }

    await interaction.reply({ content: 'Coming soon...', flags: [MessageFlags.Ephemeral] });
  },
};

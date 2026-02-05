import { codeBlock, ContainerBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { createEvent, getAccount, getEvents, getUser } from '../db/queries.js';
import { MessageTone, noUserContainer } from '../utils/containers.js';
import { BotConfig } from '../../config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('data')
    .setDescription('View all your account data')
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),
  /** @param {import("discord.js").ChatInputCommandInteraction} interaction */
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
        source: 'slash',
        action: 'data',
      });
    }

    const container = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(`**User**\n${codeBlock('json', JSON.stringify(user, null, 2))}`)
    );

    const account = await getAccount(interaction.user.id);
    if (account) {
      container.addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `**Account**\n${codeBlock('json', JSON.stringify(account, null, 2))}`
        )
      );
    }

    const events = await getEvents(interaction.user.id, 4);
    if (events && events.length > 0) {
      container.addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(`**Events**\n${codeBlock('json', JSON.stringify(events, null, 2))}`)
      );
    }

    await interaction.reply({
      components: [container],
      flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
    });
  },
};

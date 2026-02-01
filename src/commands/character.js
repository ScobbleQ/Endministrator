import {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { getUser } from '../db/queries.js';
import { generateCredByCode } from '../skport/api/auth/generateCredByCode.js';
import { grantOAuth } from '../skport/api/auth/grant.js';
import { cardDetail } from '../skport/api/profile/cardDetail.js';
import { createCache, getOrSet } from '../skport/util/cache.js';
import { computeSign } from '../skport/util/computeSign.js';
import { ElementType, Profession } from '../skport/util/constants.js';
import { ProfessionEmojis, PropertyEmojis } from '../utils/emojis.js';

/** @typedef {import('../skport/api/profile/cardDetail.js').Characters} Characters */

// Cache for owned characters (30 minutes TTL)
const CACHE_KEY = 'characters';
const charactersCache = createCache(3 * 60 * 1000);

/**
 *
 * @param {string} dcid
 * @returns {Promise<{ status: -1, msg: string } | { status: 0, data: Characters[] }>}
 */
const getCharacters = async (dcid) => {
  return await getOrSet(charactersCache, CACHE_KEY, async () => {
    const user = await getUser(dcid);
    if (!user) {
      return { status: -1, msg: 'Please login with /login first' };
    }

    const oauth = await grantOAuth({ token: user.loginToken, type: 0 });
    if (!oauth || oauth.status !== 0) {
      return { status: -1, msg: 'Failed to grant OAuth token' };
    }

    // @ts-ignore: code is guaranteed since we are using type 0
    const cred = await generateCredByCode({ code: oauth.data.code });
    if (!cred || cred.status !== 0) {
      return { status: -1, msg: 'Failed to generate credentials' };
    }

    const signToken = computeSign({
      token: cred.data.token,
      path: '/api/v1/game/endfield/card/detail',
      body: '{}',
    });

    const card = await cardDetail({
      serverId: user.serverId,
      roleId: user.roleId,
      userId: user.userId,
      cred: cred.data.cred,
      signToken: signToken,
    });

    if (!card || card.status !== 0) {
      return { status: -1, msg: card.msg || 'Failed to get card detail' };
    }

    return { status: 0, data: card.data.chars };
  });
};

export default {
  data: new SlashCommandBuilder()
    .setName('character')
    .setDescription('View your characters')
    .addStringOption((option) =>
      option.setName('name').setDescription('The name of the character').setAutocomplete(true)
    )
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),
  /**
   * @param {import("discord.js").AutocompleteInteraction} interaction
   */
  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);

    const characters = await getCharacters(interaction.user.id);
    if (!characters || characters.status !== 0) {
      await interaction.respond([{ name: characters.msg, value: -999 }]);
      return;
    }

    const filtered = characters.data
      .filter((c) => c.charData.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
      .slice(0, 25);

    await interaction.respond(
      filtered.map((c) => ({ name: c.charData.name, value: c.charData.id }))
    );
  },
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @returns {Promise<void>}
   */
  async execute(interaction) {
    const selected = interaction.options.getString('name');
    if (selected) {
      const characters = await getCharacters(interaction.user.id);

      // Error getting characters
      if (!characters || characters.status !== 0) {
        const errorContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(characters.msg)
        );
        await interaction.reply({ components: [errorContainer], flags: [MessageFlags.Ephemeral] });
        return;
      }

      // Character not found
      const character = characters.data.find((c) => c.charData.id === selected);
      if (!character) {
        const notFoundContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent('Character not found')
        );
        await interaction.reply({
          components: [notFoundContainer],
          flags: [MessageFlags.Ephemeral],
        });
        return;
      }
      return;

      // Yay
    }

    const catalogContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent('# Operators')
    );

    catalogContainer.addActionRowComponents((actionRow) =>
      actionRow.setComponents(
        new StringSelectMenuBuilder()
          .setCustomId('operator-class')
          .setPlaceholder('Filter by operator class')
          .addOptions(
            Object.values(Profession).map((p) => ({
              emoji: ProfessionEmojis[/** @type {keyof typeof ProfessionEmojis} */ (p.name)],
              label: p.name,
              value: p.value,
            }))
          )
      )
    );

    catalogContainer.addActionRowComponents((actionRow) =>
      actionRow.setComponents(
        new StringSelectMenuBuilder()
          .setCustomId('element-type')
          .setPlaceholder('Filter by element type')
          .addOptions(
            Object.values(ElementType).map((e) => ({
              emoji: PropertyEmojis[/** @type {keyof typeof PropertyEmojis} */ (e.name)],
              label: e.name,
              value: e.value,
            }))
          )
      )
    );

    catalogContainer.addSeparatorComponents((separator) => separator);

    // display up to 5 characters
    // Display no characters text if none

    catalogContainer.addSeparatorComponents((separator) => separator);

    // if more than 5 characters, display previous and next buttons
    const previousButton = new ButtonBuilder()
      .setCustomId('characters-page:previous')
      .setLabel('Previous')
      .setStyle(ButtonStyle.Secondary);

    const nextButton = new ButtonBuilder()
      .setCustomId('characters-page:next')
      .setLabel('Next')
      .setStyle(ButtonStyle.Secondary);

    catalogContainer.addActionRowComponents((actionRow) =>
      actionRow.addComponents(previousButton, nextButton)
    );

    await interaction.reply({
      components: [catalogContainer],
      flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
    });
  },
};

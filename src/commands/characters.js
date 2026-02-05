import {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { ElementType, Profession } from '../skport/utils/constants.js';
import { getCachedCardDetail } from '../skport/utils/getCachedCardDetail.js';
import { textContainer } from '../utils/containers.js';
import { ProfessionEmojis, PropertyEmojis, RarityEmoji } from '../utils/emojis.js';

/** @typedef {import('../skport/api/profile/cardDetail.js').Characters} Characters */

const CHARS_PER_PAGE = 5;
const INITIAL_STATE = { page: 0, profession: 'all', element: 'all' };

/** @param {Characters} c */
const getProfessionName = (c) => c.charData.profession.value;

/** @param {Characters} c */
const getElementName = (c) => c.charData.property.value;

/**
 * @param {string} dcid
 * @returns {Promise<{ status: -1, msg: string } | { status: 0, data: Characters[] }>}
 */
const getCharacters = async (dcid) => {
  const result = await getCachedCardDetail(dcid);
  if (result.status !== 0) return result;
  return { status: 0, data: result.data.chars };
};

/**
 * @param {string} stateStr - Format: page:profession:element
 * @returns {{ page: number, profession: string, element: string }}
 */
const parseState = (stateStr) => {
  const [page = '0', profession = 'all', element = 'all'] = stateStr.split(':');
  return {
    page: Math.max(0, parseInt(page, 10) || 0),
    profession,
    element,
  };
};

/**
 * @param {Characters} char
 * @param {string} profession
 * @returns {boolean}
 */
const matchesProfession = (char, profession) => {
  if (profession === 'all') return true;
  const p = char.charData.profession;
  if (!p) return false;
  const entry = Object.values(Profession).find((e) => e.value === profession);
  return p.value === profession || p.key === profession || (entry && p.key === entry.id) || false;
};

/**
 * @param {Characters} char
 * @param {string} element
 * @returns {boolean}
 */
const matchesElement = (char, element) => {
  if (element === 'all') return true;
  const prop = char.charData.property;
  if (!prop) return false;
  const entry = Object.values(ElementType).find((e) => e.value === element);
  return (
    prop.value === element || prop.key === element || (entry && prop.key === entry.id) || false
  );
};

/**
 * @param {Characters[]} chars
 * @param {{ page: number, profession: string, element: string }} state
 * @returns {ContainerBuilder}
 */
const buildCatalogContainer = (chars, { page, profession, element }) => {
  const filtered = chars.filter(
    (c) => matchesProfession(c, profession) && matchesElement(c, element)
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / CHARS_PER_PAGE));
  const clampedPage = Math.min(page, totalPages - 1);
  const pageChars = filtered.slice(
    clampedPage * CHARS_PER_PAGE,
    (clampedPage + 1) * CHARS_PER_PAGE
  );
  const stateStr = `${clampedPage}:${profession}:${element}`;

  const container = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
    textDisplay.setContent('# ▼// Owned Operators')
  );

  container.addActionRowComponents((actionRow) =>
    actionRow.setComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`characters-filter-opclass-${stateStr}`)
        .setPlaceholder('Filter by operator class')
        .addOptions(
          { label: 'All', value: 'all' },
          ...Object.values(Profession).map((p) => ({
            emoji: ProfessionEmojis[/** @type {keyof typeof ProfessionEmojis} */ (p.name)],
            label: p.name,
            value: p.value,
            default: p.value === profession ? true : false,
          }))
        )
    )
  );

  container.addActionRowComponents((actionRow) =>
    actionRow.setComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`characters-filter-element-${stateStr}`)
        .setPlaceholder('Filter by element type')
        .addOptions(
          { label: 'All', value: 'all' },
          ...Object.values(ElementType).map((e) => ({
            emoji: PropertyEmojis[/** @type {keyof typeof PropertyEmojis} */ (e.name)],
            label: e.name,
            value: e.value,
            default: e.value === element ? true : false,
          }))
        )
    )
  );

  container.addSeparatorComponents((separator) => separator);

  if (pageChars.length === 0) {
    container.addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent('No operators found.')
    );
  } else {
    for (const op of pageChars) {
      const profName = getProfessionName(op);
      const propName = getElementName(op);
      container.addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              [
                `**${op.charData.name}** ${ProfessionEmojis[/** @type {keyof typeof ProfessionEmojis} */ (profName)]} ${PropertyEmojis[/** @type {keyof typeof PropertyEmojis} */ (propName)]}`,
                `${RarityEmoji}`.repeat(Number(op.charData.rarity?.value ?? 0)),
                `Level ${op.level} · Recruited <t:${op.ownTs}:d>`,
              ].join('\n')
            )
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(`characters-view:${op.charData.id}`)
              .setLabel('View Character')
              .setStyle(ButtonStyle.Primary)
          )
      );
    }
  }

  if (filtered.length > CHARS_PER_PAGE) {
    container.addSeparatorComponents((separator) => separator);

    const prevStateStr = `${Math.max(0, clampedPage - 1)}:${profession}:${element}`;
    const nextStateStr = `${Math.min(totalPages - 1, clampedPage + 1)}:${profession}:${element}`;

    container.addActionRowComponents((actionRow) =>
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`characters-page-prev-${prevStateStr}`)
          .setLabel('Previous')
          .setStyle(clampedPage === 0 ? ButtonStyle.Secondary : ButtonStyle.Primary)
          .setDisabled(clampedPage === 0),
        new ButtonBuilder()
          .setCustomId(`characters-page-display`)
          .setLabel(`${clampedPage + 1} / ${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`characters-page-next-${nextStateStr}`)
          .setLabel('Next')
          .setStyle(clampedPage >= totalPages - 1 ? ButtonStyle.Secondary : ButtonStyle.Primary)
          .setDisabled(clampedPage >= totalPages - 1)
      )
    );
  }

  return container;
};

/**
 * @param {Characters} character
 * @returns {ContainerBuilder}
 */
const buildCharacterContainer = (character) => {
  const { charData, level, evolvePhase, ownTs } = character;
  const profName = getProfessionName(character);
  const propName = getElementName(character);

  return new ContainerBuilder().addSectionComponents((section) =>
    section
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          [
            `## ${charData.name}`,
            `${ProfessionEmojis[/** @type {keyof typeof ProfessionEmojis} */ (profName)]} ${profName} · ${PropertyEmojis[/** @type {keyof typeof PropertyEmojis} */ (propName)]} ${propName}`,
            `${RarityEmoji}`.repeat(Number(charData.rarity?.value ?? 0)),
            `Level **${level}** · Phase **${evolvePhase}**`,
            `Recruited <t:${ownTs}:D> at <t:${ownTs}:t>`,
          ].join('\n')
        )
      )
      .setThumbnailAccessory((thumb) => thumb.setURL(charData.avatarRtUrl))
  );
};

/**
 * Parse button customId and return action + payload
 * @param {string[]} args - From customId split by '-'
 * @returns {{ action: string, payload: string }}
 */
const parseButtonArgs = (args) => {
  const first = args[0] ?? '';
  if (first.includes(':')) {
    const [action, ...rest] = first.split(':');
    return { action: action ?? '', payload: rest.join(':') ?? '' };
  }
  return { action: first, payload: args[2] ?? '' };
};

export default {
  data: new SlashCommandBuilder()
    .setName('characters')
    .setDescription('View your characters')
    .addStringOption((option) =>
      option.setName('name').setDescription('The name of the character').setAutocomplete(true)
    )
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),

  /** @param {import('discord.js').AutocompleteInteraction} interaction */
  async autocomplete(interaction) {
    const { value } = interaction.options.getFocused(true);
    const characters = await getCharacters(interaction.user.id);

    if (!characters || characters.status !== 0) {
      const code = JSON.parse(characters.msg).code || characters.status || -1;
      const msg = JSON.parse(characters.msg).message || characters.msg || 'Unknown error';

      await interaction.respond([{ name: `[${code}] ${msg}`, value: '-999' }]);
      return;
    }

    const filtered = characters.data
      .filter((c) => c.charData.name.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 25);

    await interaction.respond(
      filtered.map((c) => ({ name: c.charData.name, value: c.charData.id }))
    );
  },
  /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
  async execute(interaction) {
    const selected = interaction.options.getString('name');
    await interaction.deferReply();

    const characters = await getCharacters(interaction.user.id);
    if (!characters || characters.status !== 0) {
      const code = JSON.parse(characters.msg).code || characters.status || -1;
      const msg = JSON.parse(characters.msg).message || characters.msg || 'Unknown error';

      await interaction.editReply({
        components: [textContainer(`### [${code}] ${msg}`)],
        flags: [MessageFlags.IsComponentsV2],
      });
      return;
    }

    if (selected) {
      const character = characters.data.find((c) => c.charData.id === selected);
      if (!character) {
        await interaction.editReply({ components: [textContainer('Character not found')] });
        return;
      }
      await interaction.editReply({
        components: [buildCharacterContainer(character)],
        flags: [MessageFlags.IsComponentsV2],
      });
      return;
    }

    await interaction.editReply({
      components: [buildCatalogContainer(characters.data, INITIAL_STATE)],
      flags: [MessageFlags.IsComponentsV2],
    });
  },
  /** @param {import('discord.js').ButtonInteraction} interaction @param {...string} args */
  async button(interaction, ...args) {
    const { action, payload } = parseButtonArgs(args);
    await interaction.deferUpdate();

    const characters = await getCharacters(interaction.user.id);
    if (!characters || characters.status !== 0) {
      await interaction.editReply({
        components: [textContainer(characters?.msg || 'Failed to load characters')],
      });
      return;
    }

    if (action === 'view' && payload) {
      const character = characters.data.find((c) => c.charData.id === payload);
      if (character) {
        await interaction.editReply({ components: [buildCharacterContainer(character)] });
      }
      return;
    }

    if (action === 'page' && payload) {
      const container = buildCatalogContainer(characters.data, parseState(payload));
      await interaction.editReply({ components: [container] });
    }
  },
  /** @param {import('discord.js').StringSelectMenuInteraction} interaction @param {...string} args */
  async selectMenu(interaction, ...args) {
    const [filterType, filterWhich, stateStr] = args;
    if (filterType !== 'filter' || !stateStr) return;

    await interaction.deferUpdate();

    const state = parseState(stateStr);
    const selectedValue = interaction.values[0];
    const profession = filterWhich === 'opclass' ? selectedValue : state.profession;
    const element = filterWhich === 'element' ? selectedValue : state.element;

    const characters = await getCharacters(interaction.user.id);
    if (!characters || characters.status !== 0) {
      await interaction.editReply({
        components: [textContainer(characters?.msg || 'Failed to load characters')],
      });
      return;
    }

    const container = buildCatalogContainer(characters.data, { page: 0, profession, element });
    await interaction.editReply({ components: [container] });
  },
};

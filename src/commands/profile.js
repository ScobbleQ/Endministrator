import {
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SlashCommandBuilder,
  TextDisplayBuilder,
  codeBlock,
} from 'discord.js';
import { BotConfig } from '../../config.js';
import { createEvent, getUser } from '../db/queries.js';
import { cardDetail, generateCredByCode, grantOAuth } from '../skport/api/index.js';
import { computeSign } from '../skport/util/computeSign.js';
import { MessageTone, noUserContainer } from '../utils/containers.js';
import { ProfessionEmojis, ProfileEmojis, PropertyEmojis, RarityEmoji } from '../utils/emojis.js';
import { privacy } from '../utils/privacy.js';

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

    const loadingContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent('Loading profile information...')
    );
    await interaction.reply({
      components: [loadingContainer],
      flags: [MessageFlags.IsComponentsV2],
    });

    // Refresh the OAuth token with a new one
    const oauth = await grantOAuth({ token: user.loginToken, type: 0 });
    if (!oauth || oauth.status !== 0) {
      return;
    }

    // @ts-ignore: code is guaranteed since we are using type 0
    const cred = await generateCredByCode({ code: oauth.data.code });
    if (!cred || cred.status !== 0) {
      return;
    }

    const signToken = computeSign({
      token: cred.data.token,
      path: '/api/v1/game/endfield/card/detail',
      body: '',
    });

    const profile = await cardDetail({
      serverId: user.serverId,
      roleId: user.roleId,
      userId: cred.data.userId,
      cred: cred.data.cred,
      signToken: signToken,
    });

    if (!profile || profile.status !== 0) {
      const errorContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `##m[${profile.status}] Failed to get profile information\n${codeBlock('json', profile.msg)}`
        )
      );
      await interaction.reply({
        components: [errorContainer],
        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
      });
      return;
    }

    const profileContainer = new ContainerBuilder();

    const introSection = new SectionBuilder()
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          [
            `## // ${profile.data.base.name}`,
            `>> Awakening Day: <t:${profile.data.base.createTime}:D>`,
            `>> UID: ${privacy(profile.data.base.roleId, user.isPrivate)}`,
            `>> Server: ${profile.data.base.serverName}`,
          ].join('\n')
        )
      )
      .setThumbnailAccessory((thumbnail) => thumbnail.setURL(profile.data.base.avatarUrl));
    profileContainer.addSectionComponents(introSection);

    const statTextDisplay = new TextDisplayBuilder().setContent(
      [
        `Authority Level: ${profile.data.base.level}`,
        `Exploration Level: ${profile.data.base.worldLevel}`,
        `Operators: ${profile.data.base.charNum}`,
        `Weapons: ${profile.data.base.weaponNum}`,
        `Archives: ${profile.data.base.docNum}`,
        `Path of Glory: ${profile.data.achieve.count}`,
        `Control Nexux Level: ${profile.data.spaceShip.rooms.find((r) => r.id === 'control_center')?.level}`,
      ].join('\n')
    );
    profileContainer.addTextDisplayComponents(statTextDisplay);

    profileContainer.addSeparatorComponents((separator) => separator);

    const realTimeDataTextDisplay = new TextDisplayBuilder().setContent(
      [
        `### ${ProfileEmojis.RealTimeData} [ Real-Time Data ]`,
        `Sanity: **${profile.data.dungeon.curStamina}** / ${profile.data.dungeon.maxStamina}`,
        profile.data.dungeon.maxTs !== '0' && `Full Recovery <t:${profile.data.dungeon.maxTs}:R>`,
        `Activity Points: **${profile.data.dailyMission.dailyActivation}** / ${profile.data.dailyMission.maxDailyActivation}`,
        `Protocol Pass: **${profile.data.bpSystem.curLevel}** / ${profile.data.bpSystem.maxLevel}`,
      ]
        .filter(Boolean)
        .join('\n')
    );
    profileContainer.addTextDisplayComponents(realTimeDataTextDisplay);

    const domains = profile.data.domain
      .flatMap((d) => [
        `**${d.name}** Lv.${d.level}`,
        ...d.settlements.map((s) => `-# - ${s.name}: ${s.level}`),
      ])
      .join('\n');

    profileContainer.addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        `### ${ProfileEmojis.RegionalDevelopment} [ Regional Development ]\n${domains}`
      )
    );

    profileContainer.addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(`### ${ProfileEmojis.Operator} [ Operators ]`)
    );

    for (const operator of profile.data.chars.slice(0, 3)) {
      profileContainer.addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              [
                `**${operator.charData.name}** ${ProfessionEmojis[/** @type {keyof typeof ProfessionEmojis} */ (operator.charData.profession.value)]} ${PropertyEmojis[/** @type {keyof typeof PropertyEmojis} */ (operator.charData.property.value)]}`,
                `${RarityEmoji}`.repeat(Number(operator.charData.rarity.value)),
                `Recruited <t:${operator.ownTs}:d> at <t:${operator.ownTs}:t>`,
                `Level: ${operator.level}`,
              ].join('\n')
            )
          )
          .setThumbnailAccessory((thumbnail) => thumbnail.setURL(operator.charData.avatarRtUrl))
      );
    }

    await interaction.editReply({
      components: [profileContainer],
      flags: [MessageFlags.IsComponentsV2],
    });
  },
};

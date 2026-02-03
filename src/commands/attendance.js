import { ContainerBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { BotConfig } from '../../config.js';
import { createEvent, getUser } from '../db/queries.js';
import { attendance, generateCredByCode, grantOAuth } from '../skport/api/index.js';
import { computeSign } from '../skport/utils/computeSign.js';
import { MessageTone, noUserContainer, textContainer } from '../utils/containers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('attendance')
    .setDescription('Attendance to SKPort')
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
        interaction: 'discord',
        metadata: {
          type: 'slash',
          command: 'attendance',
        },
      });
    }

    const oauth = await grantOAuth({ token: user.loginToken, type: 0 });
    if (!oauth || oauth.status !== 0) {
      return;
    }

    // @ts-ignore: code is guaranteed since we are using type 0
    const cred = await generateCredByCode({ code: oauth.data.code });
    if (!cred || cred.status !== 0) {
      return;
    }

    const sign = computeSign({
      token: cred.data.token,
      path: '/web/v1/game/endfield/attendance',
      body: '{}',
    });

    const signin = await attendance({
      cred: cred.data.cred,
      sign: sign,
      uid: user.roleId,
      serverId: user.serverId,
    });

    if (!signin || signin.status !== 0) {
      await interaction.reply({
        components: [
          textContainer(`## Failed to claim sign-in:\n\`${signin?.msg ?? 'Unknown error'}\``),
        ],
        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
      });
      return;
    }

    const attendanceContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(`# ▼// Today's Sign-in Rewards`)
    );

    for (const resource of signin.data) {
      attendanceContainer.addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(`### ${resource.name}\nAmount: **${resource.count}**`)
          )
          .setThumbnailAccessory((thumbnail) => thumbnail.setURL(resource.icon))
      );
    }

    await interaction.reply({
      components: [attendanceContainer],
      flags: [MessageFlags.IsComponentsV2],
    });
  },
};

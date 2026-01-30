import { ContainerBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { BotConfig } from '../../config.js';
import { createEvent, getUser } from '../db/queries.js';
import { attendance, generateCredByCode, grantOAuth } from '../skport/api/index.js';
import { computeSign } from '../skport/util/computeSign.js';
import { MessageTone, noUserContainer } from '../utils/containers.js';

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
          timestamp: Date.now(),
        },
      });
    }

    const oauth = await grantOAuth({ token: user.lToken, type: 0 });
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

    const e = await attendance({
      cred: cred.data.cred,
      sign: sign,
      uid: user.roleId,
      serverId: user.serverId,
    });

    if (!e || e.status !== 0) {
      return;
    }

    const attendanceContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(`## Daily Attendance Claimed`)
    );

    for (const resource of e.data) {
      attendanceContainer.addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(`${resource.name}\nx${resource.count}`)
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

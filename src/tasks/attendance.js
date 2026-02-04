import { ContainerBuilder, MessageFlags } from 'discord.js';
import pLimit from 'p-limit';
import { BotConfig } from '../../config.js';
import { createEvent, getAccount, getAllUsersWithAttendance } from '../db/queries.js';
import { attendance, generateCredByCode, grantOAuth } from '../skport/api/index.js';
import { computeSign } from '../skport/utils/computeSign.js';

/**
 *
 * @param {import('discord.js').Client} client
 */
export async function checkAttendance(client) {
  // Random delay between 0 and 55 minutes
  const delay = Math.floor(Math.random() * 56) * 60 * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const users = await getAllUsersWithAttendance();
  console.info(`[Cron:Attendance] Checking attendance for ${users.length} users`);
  const limit = pLimit(10);

  const task = users.map((u) =>
    limit(async () => {
      try {
        const skport = await getAccount(u.dcid);
        if (!skport) throw new Error("User's SKPort data not found");

        const oauth = await grantOAuth({ token: skport.accountToken, type: 0 });
        if (!oauth || oauth.status !== 0) throw new Error(oauth?.msg ?? 'OAuth failed');

        // @ts-ignore: code is guaranteed since we are using type 0
        const cred = await generateCredByCode({ code: oauth.data.code });
        if (!cred || cred.status !== 0) {
          throw new Error(cred?.msg ?? 'Credential generation failed');
        }

        const sign = computeSign({
          token: cred.data.token,
          path: '/web/v1/game/endfield/attendance',
          body: '',
        });

        const attendanceRes = await attendance({
          cred: cred.data.cred,
          sign: sign,
          uid: skport.roleId,
          serverId: skport.serverId,
        });

        if (!attendanceRes || attendanceRes.status !== 0) {
          throw new Error(attendanceRes?.msg ?? 'Attendance claim failed');
        }

        await createEvent(u.dcid, {
          interaction: 'cron',
          metadata: {
            type: 'attendance',
            reward: {
              name: attendanceRes.data[0].name,
              count: attendanceRes.data[0].count,
              icon: attendanceRes.data[0].icon,
            },
            bonus: attendanceRes.data.slice(1).map((r) => ({
              name: r.name,
              count: r.count,
              icon: r.icon,
            })),
          },
        });

        if (skport.enableNotif) {
          const container = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `# ▼// Daily Sign-in Summary\n-# <t:${Math.floor(Date.now() / 1000)}:F>`
            )
          );

          container.addSeparatorComponents((separator) => separator);

          for (const reward of attendanceRes.data) {
            container.addSectionComponents((section) =>
              section
                .addTextDisplayComponents((textDisplay) =>
                  textDisplay.setContent(`### ${reward.name}\nAmount: **${reward.count}**`)
                )
                .setThumbnailAccessory((thumbnail) => thumbnail.setURL(reward.icon))
            );
          }

          try {
            await client.users.send(u.dcid, {
              components: [container],
              flags: [MessageFlags.IsComponentsV2],
            });
          } catch (error) {
            console.error(`[Cron:Attendance] Failed to DM user ${u.dcid}:`, error);
          }
        }
      } catch (error) {
        console.error(`[Cron:Attendance] Error checking attendance for user ${u.dcid}:`, error);
      }
    })
  );

  await Promise.allSettled(task).then(() => {
    console.info('[Cron:Attendance] Attendance checked');
  });
}

import pLimit from 'p-limit';
import { getAllUsers, getSkportUser, getUser, updateSkportUser } from '../../db/queries.js';
import { accountToken, generateCredByCode, grantOAuth } from '../api/index.js';

/**
 *
 */
export async function refreshLoginToken() {
  // Random delay between 0 and 55 minutes
  const delay = Math.floor(Math.random() * 56) * 60 * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  console.info('[Cron:RefreshLoginToken] Refreshing login tokens for all users');
  const users = await getAllUsers();
  const limit = pLimit(10);

  const task = users.map((u) =>
    limit(async () => {
      try {
        const user = await getUser(u.dcid);
        if (!user) return;

        const skport = await getSkportUser(u.dcid);
        if (!skport) return;

        const oauth = await grantOAuth({ token: skport.loginToken, type: 0 });
        if (!oauth || oauth.status !== 0) return;

        // @ts-ignore: code is guaranteed since we are using type 0
        const cred = await generateCredByCode({ code: oauth.data.code });
        if (!cred || cred.status !== 0) return;

        const token = await accountToken(skport.loginToken, cred.data.token, skport.hgId);
        if (token.status !== 0) return;

        await updateSkportUser(u.dcid, { key: 'loginToken', value: token.data });
      } catch (error) {
        console.error(
          `[Cron:RefreshLoginToken] Error refreshing login token for user ${u.dcid}:`,
          error
        );
      }
    })
  );

  await Promise.allSettled(task);
}

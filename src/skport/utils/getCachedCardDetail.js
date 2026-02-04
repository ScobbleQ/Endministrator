import { getAccount, getUser } from '../../db/queries.js';
import { generateCredByCode, grantOAuth } from '../api/auth/index.js';
import { cardDetail } from '../api/profile/index.js';
import { getOrCreateCache, getOrSet } from './cache.js';

/** @typedef {import('../api/profile/cardDetail.js').CardDetail} CardDetail */

const CARD_DETAIL_TTL = 30 * 60 * 1000; // 30 minutes
const cardDetailCache = getOrCreateCache('card-detail', CARD_DETAIL_TTL);

/**
 * @param {string} dcid
 * @returns {Promise<{ status: -1, msg: string } | { status: 0, data: CardDetail }>}
 */
export async function getCachedCardDetail(dcid) {
  const cacheKey = `card-detail-${dcid}`;
  return getOrSet(cardDetailCache, cacheKey, async () => {
    const user = await getUser(dcid);
    if (!user) return { status: -1, msg: 'Please login with /login first' };

    const skport = await getAccount(dcid);
    if (!skport) return { status: -1, msg: 'Please add a SKPort account with /add account first' };

    const oauth = await grantOAuth({ token: skport.accountToken, type: 0 });
    if (!oauth || oauth.status !== 0) return { status: -1, msg: 'Failed to grant OAuth token' };

    // @ts-ignore - code is guaranteed when using type 0
    const cred = await generateCredByCode({ code: oauth.data.code });
    if (!cred || cred.status !== 0) return { status: -1, msg: 'Failed to generate credentials' };

    const card = await cardDetail({
      serverId: skport.serverId,
      roleId: skport.roleId,
      userId: skport.userId,
      cred: cred.data.cred,
      token: cred.data.token,
    });

    if (!card || card.status !== 0) {
      return { status: -1, msg: card.msg ?? 'Failed to get card detail' };
    }

    return { status: 0, data: card.data };
  });
}

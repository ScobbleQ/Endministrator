import axios from 'axios';
import UserAgent from 'user-agents';

/**
 * @typedef {Object} AttendanceResponse
 * @property {string} ts
 * @property {AwardIds[]} awardIds
 * @property {Object<string, ResourceItem>} resourceInfoMap
 */

/**
 * @typedef {Object} AwardIds
 * @property {string} id
 * @property {string} type
 */

/**
 * @typedef {Object} ResourceItem
 * @property {string} id
 * @property {number} count
 * @property {string} name
 * @property {string} icon
 */

/**
 *
 * @param {{cred: string, sign: string, uid: string}} param0
 * @returns {Promise<{ status: -1, msg: string } | { status: 0, data: ResourceItem[] }>}
 */
export async function attendance({ cred, sign, uid }) {
  const url = 'https://zonai.skport.com/web/v1/game/endfield/attendance';
  const headers = {
    Accept: '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Content-Length': '0',
    'Content-Type': 'application/json',
    cred: cred,
    Origin: 'https://game.skport.com',
    platform: '3',
    Pragma: 'no-cache',
    Priority: 'u=3, i',
    Referer: 'https://game.skport.com/',
    sign: sign,
    'sk-game-role': `3_${uid}_3`,
    'sk-language': 'en',
    timestamp: Math.floor(Date.now() / 1000).toString(),
    'User-Agent': new UserAgent({ deviceCategory: 'desktop' }).toString(),
    vName: '1.0.0',
  };

  try {
    const res = await axios.post(url, { headers });
    if (res.status !== 200 || res.data.code !== 0) {
      const msg = res.data.msg || 'Failed to get attendance. Please try again.';
      return { status: -1, msg };
    }

    const data = /** @type {AttendanceResponse} */ (res.data.data);

    /** @type {ResourceItem[]} */
    const rewards = [];

    for (const award of data.awardIds) {
      const reward = data.resourceInfoMap[award.id];
      if (!reward) continue;
      rewards.push(reward);
    }

    return { status: 0, data: rewards };
  } catch (error) {
    return { status: -1, msg: 'Failed to get attendance. Please try again.' };
  }
}

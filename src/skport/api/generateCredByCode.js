import axios from 'axios';
import UserAgent from 'user-agents';

/**
 *
 * @param {{ code: string }} param0
 * @returns {Promise<{ status: -1, msg: string } | { status: 0, data: { cred: string, userId: string, token: string } }>}
 */
export async function generateCredByCode({ code }) {
  const url = 'https://zonai.skport.com/web/v1/user/auth/generate_cred_by_code';
  const headers = {
    Accept: '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/json',
    Origin: 'https://game.skport.com',
    platform: '3',
    Pragma: 'no-cache',
    Priority: 'u=3, i',
    Referer: 'https://game.skport.com/',
    'sk-language': 'en',
    timestamp: Math.floor(Date.now() / 1000).toString(),
    'User-Agent': new UserAgent({ deviceCategory: 'desktop' }).toString(),
    vName: '1.0.0',
  };

  const requestData = {
    kind: 1,
    code: code,
  };

  try {
    const res = await axios.post(url, requestData, { headers });
    if (res.status !== 200 || res.data.code !== 0) {
      const msg = res.data.msg || 'Failed to generate cred by code. Please try again.';
      return { status: -1, msg };
    }

    return { status: 0, data: res.data.data };
  } catch (error) {
    return { status: -1, msg: 'Failed to generate cred by code. Please try again.' };
  }
}

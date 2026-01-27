import axios from 'axios';
import UserAgent from 'user-agents';

/**
 *
 * @param {{ token: string }} param0
 * @returns {Promise<{ status: -1, msg: string } | { status: 0, data: { uid: string, code: string } }>}
 */
export async function oauth({ token }) {
  const url = 'https://as.gryphline.com/user/oauth2/v2/grant';
  const headers = {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/json',
    Origin: 'https://www.skport.com',
    Pragma: 'no-cache',
    Priority: 'u=3, i',
    Referer: 'https://www.skport.com/',
    'User-Agent': new UserAgent({ deviceCategory: 'desktop' }).toString(),
    'x-language': 'en-us',
  };

  const requestData = {
    token: token,
    appCode: '6eb76d4e13aa36e6',
    type: 0,
  };

  try {
    const res = await axios.post(url, requestData, { headers });
    if (res.status !== 200 || res.data.status !== 0) {
      const msg = res.data.msg || 'Failed to get OAuth token. Please try again.';
      return { status: -1, msg };
    }

    return { status: 0, data: res.data.data };
  } catch (error) {
    return { status: -1, msg: 'Failed to get OAuth token. Please try again.' };
  }
}

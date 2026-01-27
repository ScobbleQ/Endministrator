import axios from 'axios';
import UserAgent from 'user-agents';

/**
 * Get account token from the API
 * @param {string} token
 * @returns {Promise<{ status: -1, msg: string } | { status: 0, data: string[] }>}
 */
export async function accountToken(token) {
  const url = 'https://web-api.skport.com/cookie_store/account_token';
  const headers = {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.9',
    'Access-Control-Request-Headers': 'content-type,x-language',
    'Access-Control-Request-Method': 'POST',
    'Cache-Control': 'no-cache',
    Origin: 'https://www.skport.com',
    Pragma: 'no-cache',
    Priority: 'u=0, i',
    Referer: 'https://www.skport.com/',
    'User-Agent': new UserAgent({ deviceCategory: 'desktop' }).toString(),
  };

  const requestData = {
    content: token,
  };

  try {
    // Options preflight
    await axios.options(url, { headers });

    // Attempt to get account token
    const res = await axios.post(url, requestData, { headers, withCredentials: true });
    if (res.status !== 200 || res.data.status !== 0) {
      const msg = res.data.msg || 'Failed to get account token. Please try again.';
      return { status: -1, msg };
    }

    return { status: 0, data: res.headers['set-cookie'] || [] };
  } catch (error) {
    return { status: -1, msg: 'Failed to get account token. Please try again.' };
  }
}

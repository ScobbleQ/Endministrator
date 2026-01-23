import axios from 'axios';
import UserAgent from 'user-agents';

/**
 * Get token with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ status: -1, msg: string } | { status: 0, data: { token: string, hgId: string, email: string, isLatestUserAgreement: boolean } }>}
 * @example
 * const token = await tokenByEmailPassword('test@example.com', 'password');
 * console.dir(token, { depth: null });
 */
export async function tokenByEmailPassword(email, password) {
  const url = 'https://as.gryphline.com/user/auth/v1/token_by_email_password';
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

  try {
    // Options preflight
    await axios.options(url, { headers });

    // Attempt to get token
    const res = await axios.post(url, { email, password }, { headers });
    if (res.status !== 200 || res.data.status !== 0) {
      const msg = res.data.msg ?? 'Failed to login. Please try again.';
      return { status: -1, msg };
    }

    return { status: 0, data: res.data.data };
  } catch (error) {
    return { status: -1, msg: 'Failed to login. Please try again.' };
  }
}

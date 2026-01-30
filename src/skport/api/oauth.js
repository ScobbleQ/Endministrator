/**
 * Get OAuth token from SKPort via the app
 * @param {{ token: string, type: 0 | 1 }} param0
 * @returns {Promise<{ status: -1, msg: string } | { status: 0, data: { uid: string, code: string } | { token: string, hgId: string} }>}
 * @example
 * // Login with email and password
 * const login = await tokenByEmailPassword('test@example.com', 'password');
 *
 * // Grant OAuth token
 * const oauth = await grantOAuth({ token: login.data.token, appCode: '3dacefa138426cfe' });
 * console.dir(oauth, { depth: null });
 */
export async function grantOAuth({ token, type }) {
  const url = 'https://as.gryphline.com/user/oauth2/v2/grant';

  const body = {
    appCode: type === 0 ? '6eb76d4e13aa36e6' : '3dacefa138426cfe',
    token: token,
    type: type,
  };

  const headers = {
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    Accept: '*\/*',
    'Content-Type': 'application\/json',
    Host: 'as.gryphline.com',
    'User-Agent': 'skport-ios\/701014 CFNetwork\/3860.300.31 Darwin\/25.2.0',
    'Content-Length': JSON.stringify(body).length.toString(),
    'X-Language': 'en-us',
    Connection: 'keep-alive',
    'X-Captcha-Version': '4.0',
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const msg = await res.text();
      return { status: -1, msg };
    }

    const data = await res.json();
    if (data.status !== 0) {
      return { status: -1, msg: data.msg };
    }

    return { status: 0, data: data.data };
  } catch (error) {
    return { status: -1, msg: /** @type {Error} */ (error).message };
  }
}

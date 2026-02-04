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

  const optionHeaders = {
    Accept: '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Access-Control-Request-Headers': 'content-type,x-language',
    'Access-Control-Request-Method': 'POST',
    Connection: 'keep-alive',
    'Content-Length': '0',
    Host: 'as.gryphline.com',
    Origin: 'https://game.skport.com',
    Referer: 'https://game.skport.com/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 SKPort/1.0.0(100000018)',
  };

  const postHeaders = {
    Accept: '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    Connection: 'keep-alive',
    'Content-Length': JSON.stringify(body).length.toString(),
    'Content-Type': 'application/json',
    Host: 'as.gryphline.com',
    'User-Agent': 'skport-ios/100000018 CFNetwork/3860.300.31 Darwin/25.2.0',
    'X-Captcha-Version': '4.0',
    'X-Language': 'en-us',
  };

  try {
    await fetch(url, { method: 'OPTIONS', headers: optionHeaders });

    const res = await fetch(url, {
      method: 'POST',
      headers: postHeaders,
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

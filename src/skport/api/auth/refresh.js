import UserAgent from 'user-agents';

/**
 * Refresh the token used to sign requests to the API
 * @param {{ cred: string }} param0
 * @returns {Promise<{ status: -1, msg: string } | { status: 0, data: { token: string } }>}
 * @example
 * // Login with email and password
 * const login = await tokenByEmailPassword('test@example.com', 'password');
 * const oauth = await grantOAuth({ token: login.data.token, type: 0 });
 *
 * // Exchange the OAuth token for credentials
 * const cred = await generateCredByCode({ code: oauth.data.code });
 *
 * // Refresh the token used to sign requests to the API
 * const refresh = await refreshToken({ cred: cred.data.cred });
 * console.dir(refresh, { depth: null });
 */
export async function refreshToken({ cred }) {
  const url = 'https://zonai.skport.com/web/v1/auth/refresh';

  const headers = {
    Accept: '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Content-Length': '0',
    'Content-Type': 'application/json',
    Origin: 'https://game.skport.com',
    Pragma: 'no-cache',
    Priority: 'u=3, i',
    Referer: 'https://game.skport.com/',
    cred: cred,
    platform: '3',
    'sk-language': 'en',
    timestamp: Math.floor(Date.now() / 1000).toString(),
    'User-Agent': new UserAgent({ deviceCategory: 'desktop' }).toString(),
    vName: '1.0.0',
  };

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    if (!res.ok) {
      const msg = await res.text();
      return { status: -1, msg };
    }

    const data = await res.json();
    return { status: 0, data: data.data };
  } catch (error) {
    return { status: -1, msg: /** @type {Error} */ (error).message };
  }
}

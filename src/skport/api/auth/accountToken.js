import UserAgent from 'user-agents';

/**
 * Get account token from the API
 * @param {string} token
 * @returns {Promise<{ status: -1, msg: string } | { status: 0, data: string[] }>}
 * @example
 * const login = await tokenByEmailPassword('test@example.com', 'password');
 *
 * const accountToken = await accountToken(login.data.token);
 * console.dir(accountToken, { depth: null });
 */
export async function accountToken(token) {
  const url = 'https://web-api.skport.com/cookie_store/account_token';

  const headers = {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/json',
    Origin: 'https://game.skport.com',
    Pragma: 'no-cache',
    Priority: 'u=3, i',
    Referer: 'https://game.skport.com/',
    'User-Agent': new UserAgent({ deviceCategory: 'desktop' }).toString(),
    'x-language': 'en-us',
  };

  const requestData = {
    content: token,
  };

  try {
    // Options preflight
    await fetch(url, { method: 'OPTIONS', headers });

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(requestData) });
    if (!res.ok) {
      const msg = await res.text();
      return { status: -1, msg };
    }

    const data = await res.json();
    if (data.status !== 0) {
      return { status: -1, msg: data.msg };
    }

    return { status: 0, data: res.headers.getSetCookie() || [] };
  } catch (error) {
    return { status: -1, msg: /** @type {Error} */ (error).message };
  }
}

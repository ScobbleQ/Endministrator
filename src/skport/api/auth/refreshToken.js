import UserAgent from 'user-agents';

/**
 *
 * @param {string} cred
 */
export const refreshToken = async (cred) => {
  const url = 'https://zonai.skport.com/web/v1/auth/refresh';

  const headers = {
    cred: cred,
    platform: '3',
    vName: '1.0.0',
    timestamp: Math.floor(Date.now() / 1000).toString(),
    'sk-language': 'en',
    'User-Agent': new UserAgent({ deviceCategory: 'desktop' }).toString(),
    Origin: 'https://game.skport.com',
    Referer: 'https://game.skport.com/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    Accept: '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    Connection: 'keep-alive',
    'Content-Type': 'application/json',
    Pragma: 'no-cache',
    Priority: 'u=3, i',
  };

  try {
    const res = await fetch(url, { method: 'GET', headers: headers });
    if (!res.ok) {
      const msg = await res.text();
      return { status: -1, msg };
    }

    const data = await res.json();
    console.log(data);
    if (data.code !== 0) {
      return { status: -1, msg: data.msg };
    }

    return { status: 0, data: data.data };
  } catch (error) {
    return { status: -1, msg: /** @type {Error} */ (error).message };
  }
};

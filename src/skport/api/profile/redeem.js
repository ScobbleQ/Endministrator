export async function redeem() {
  const url = 'https://game-hub.gryphline.com/giftcode/api/redeem';

  const body = {
    channelId: '',
    code: '',
    confirm: false,
    platform: 'iOS',
    serverId: '',
    token: '',
  };

  const headers = {
    'Content-Length': JSON.stringify(body).length.toString(),
    Accept: 'application\/json, text\/plain, *\/*',
    Origin: 'https:\/\/ef-webview.gryphline.com',
    Host: 'game-hub.gryphline.com',
    'User-Agent':
      'Mozilla\/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit\/605.1.15 (KHTML, like Gecko) Mobile\/15E148 HGWebIOS',
    'Content-Type': 'application\/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Fetch-Site': 'same-site',
    'Sec-Fetch-Mode': 'cors',
    Referer: 'https:\/\/ef-webview.gryphline.com\/',
    Connection: 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Accept-Encoding': 'gzip, deflate, br',
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
    return { status: 0, data: data };
  } catch (error) {
    return { status: -1, msg: /** @type {Error} */ (error).message };
  }
}

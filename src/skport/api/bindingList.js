import axios from 'axios';
import UserAgent from 'user-agents';

/**
 *
 * @param {{ token: string }} param0
 */
export async function bindingList({ token }) {
  const url = 'https://binding-api-account-prod.gryphline.com/account/binding/v1/binding_list';
  const headers = {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    Origin: 'https://game.skport.com',
    Pragma: 'no-cache',
    Priority: 'u=3, i',
    Referer: 'https://game.skport.com/',
    'User-Agent': new UserAgent({ deviceCategory: 'desktop' }).toString(),
    'x-language': 'en-us',
  };

  const params = {
    token,
    appCode: 'endfield',
  };

  try {
    const res = await axios.get(url, { headers, params });
    if (res.status !== 200 || res.data.status !== 0) {
      const msg = res.data.msg || 'Failed to get binding list. Please try again.';
      return { status: -1, msg };
    }
    return { status: 0, data: res.data.data };
  } catch (error) {
    return { status: -1, msg: 'Failed to get binding list. Please try again.' };
  }
}

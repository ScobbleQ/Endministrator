import crypto from 'crypto';

/**
 * Compute the signature for zonai.skport.com API requests.
 * Formula: sign = MD5(HMAC-SHA256(path + body + timestamp + headers_json, signToken))
 * @param {{ token: string, path: string, body: string }} param0
 * @returns {string}
 * @example
 * // Login with email and password
 * const login = await tokenByEmailPassword('test@example.com', 'password');
 * const oauth = await grantOAuth({ token: login.data.token, type: 0 });
 *
 * // Exchange the OAuth token for credentials
 * const cred = await generateCredByCode({ code: oauth.data.code });
 *
 * // Compute the signature
 * const sign = computeSign({ token: cred.data.token, path: '/web/v1/game/endfield/attendance', body: '{}' });
 * console.log(sign);
 */
export function computeSign({ token, path, body = '' }) {
  const ts = Math.floor(Date.now() / 1000).toString();

  const headers = JSON.stringify({
    platform: '3',
    timestamp: ts,
    dId: '', // Device ID, can be left empty
    vName: '1.0.0',
  });

  const signString = `${path}${body}${ts}${headers}`;

  const hmacResult = crypto.createHmac('sha256', token).update(signString).digest('hex');

  const sign = crypto.createHash('md5').update(hmacResult).digest('hex');

  return sign;
}

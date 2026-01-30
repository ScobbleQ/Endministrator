/**
 * @typedef {Object} CardDetail
 * @property {Base} base
 * @property {Characters[]} chars
 * @property {{ achieveMedals: [], display: {}, count: number }} achieve
 * @property {{ rooms: { id: string, type: number, level: number, chars: [], reports: Record<string, { char: [], output: {}, createdTimeTs: string }> }[] }} spaceShip
 * @property {{ domainId: string, level: number, settlements: { id: string, level: number, remainMoney: string, officerCharIds: string, name: string }[], moneyMgr: string, collections: { levelId: string, puzzleCount: number, trchestCount: number, pieceCount: number, blackboxCount: number }[], factory: null, name: string }[]} domain
 * @property {{ curStamina: string, maxTs: string, maxStamina: string }} dungeon
 * @property {{ curLevel: number, maxLevel: number }} bpSystem
 * @property {{ dailyActivation: number, maxDailyActivation: number }} dailyMission
 */

/**
 * @typedef {Object} Base
 * @property {string} serverName
 * @property {string} roleId
 * @property {string} name
 * @property {string} createTime
 * @property {string} saveTime
 * @property {string} lastLoginTime
 * @property {number} exp
 * @property {number} level
 * @property {number} worldLevel
 * @property {number} gender
 * @property {string} avatarUrl
 * @property {{ id: string, description: string }} mainMission
 * @property {number} charNum
 * @property {number} weaponNum
 * @property {number} docNum
 */

/**
 * @typedef {Object} Characters
 * @property {CharacterData} charData
 * @property {string} id
 * @property {number} level
 * @property {Record<string, { skillId: string, level: number, maxLevel: number }>} userSkills
 * @property {{}} bodyEquip
 * @property {{}} armEquip
 * @property {{}} firstAccessory
 * @property {{}} secondAccessory
 * @property {{}} tacticalItem
 * @property {number} evolvePhase
 * @property {number} potentialLevel
 * @property {{ weaponData: { id: string, name: string, iconUrl: string, rarity: { key: string, value: string }, type: { key: string, value: string }, function: string, description: string, skills: { key: string, value: string }[] }, level: number, refineLevel: number, breakthroughLevel: number, gem: null }} weapon
 * @property {string} gender
 * @property {string} ownTs
 */

/**
 * @typedef {Object} CharacterData
 * @property {string} id
 * @property {string} name
 * @property {string} avatarSqUrl
 * @property {string} avatarRtUrl
 * @property {{ key: string, value: string }} rarity
 * @property {{ key: string, value: string }} profession
 * @property {{ key: string, value: string }} property
 * @property {{ key: string, value: string }} weaponType
 * @property {{ id: string, name: string, type: { key: string, value: string }, property: { key: string, value: string }, iconUrl: string, desc: string, descParams: { abt: string, atk_scale: string, poise: string }, descLevelParams: { [key: string]: { level: string, params: { [key: string]: string } } } }[]} skills
 * @property {string} illustrationUrl
 * @property {string[]} tags
 */

/**
 *
 * @param {{ serverId: string, roleId: string, userId: string, cred: string, signToken: string }} param0
 * @returns {Promise<{ status: -1, msg: string } | { status: 0, data: CardDetail }>}
 * @example
 * // Login with email and password
 * const login = await tokenByEmailPassword('test@example.com', 'password');
 * const oauth = await grantOAuth({ token: login.data.token, type: 0 });
 *
 * // Exchange the OAuth token for credentials
 * const cred = await generateCredByCode({ code: oauth.data.code });
 *
 * // Sign the token for the binding API
 * const bindingSignature = computeSign({
 *   token: cred.data.token,
 *   path: '/api/v1/game/player/binding',
 *   body: '{}'
 * });
 *
 * // Get the endfield binding
 * const binding = await getBinding({ cred: cred.data.cred, sign: bindingSignature });
 * const endfield = binding.data.find((b) => b.appCode === 'endfield');
 * const roleInfo = endfield.bindingList[0].defaultRole;
 *
 * // Sign the token for the card detail API
 * const cardSignature = computeSign({
 *   token: cred.data.token,
 *   path: '/api/v1/game/endfield/card/detail',
 *   body: '{}'
 * });
 *
 * const card = await cardDetail({
 *   serverId: roleInfo.serverId,
 *   roleId: roleInfo.roleId,
 *   userId: cred.data.userId,
 *   cred: cred.data.cred,
 *   signToken: cardSignature,
 * });
 * console.dir(card, { depth: null });
 */
export async function cardDetail({ serverId, roleId, userId, cred, signToken }) {
  const url = 'https://zonai.skport.com/api/v1/game/endfield/card/detail';

  const params = {
    serverId: serverId,
    roleId: roleId,
    userId: userId,
  };

  const newUrl = `${url}?${new URLSearchParams(params).toString()}`;

  const headers = {
    'Accept-Encoding': 'gzip, deflate, br',
    platform: '3',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Site': 'same-site',
    Host: 'zonai.skport.com',
    'Content-Type': 'application\/json',
    sign: signToken,
    'User-Agent':
      'Mozilla\/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit\/605.1.15 (KHTML, like Gecko) Mobile\/15E148 SKPort\/0.7.1(701014)',
    cred: cred,
    timestamp: Math.floor(Date.now() / 1000).toString(),
    'Sec-Fetch-Mode': 'cors',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: 'https:\/\/game.skport.com\/',
    Accept: '*\/*',
    Connection: 'keep-alive',
    'sk-language': 'en',
    vName: '1.0.0',
    Origin: 'https:\/\/game.skport.com',
  };

  try {
    await fetch(newUrl, {
      method: 'OPTIONS',
      headers: headers,
    });

    const res = await fetch(newUrl, {
      method: 'GET',
      headers: headers,
    });

    if (!res.ok) {
      const msg = await res.text();
      return { status: -1, msg };
    }

    const data = await res.json();
    if (data.code !== 0) {
      return { status: -1, msg: data.message };
    }

    return { status: 0, data: data.data.detail };
  } catch (error) {
    return { status: -1, msg: /** @type {Error} */ (error).message };
  }
}

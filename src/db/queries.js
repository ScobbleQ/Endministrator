import { and, eq } from 'drizzle-orm';
import { db } from './index.js';
import { accounts, events, users } from './schema.js';

/**
 * Create an account in the database
 * @param {string} dcid
 * @param {{ nickname: string, accountToken: string, hgId: string, userId: string, channelId: string, serverType: string, serverId: string, serverName: string, roleId: string }} param0
 * @returns {Promise<void>}
 */
export async function createAccount(
  dcid,
  { nickname, accountToken, hgId, userId, channelId, serverType, serverId, serverName, roleId }
) {
  await db.transaction(async (tx) => {
    await tx.insert(users).values({ dcid });
    await tx.insert(accounts).values({
      dcid,
      nickname: nickname,
      accountToken: accountToken,
      hgId: hgId,
      userId: userId,
      channelId: channelId,
      serverType: serverType,
      serverId: serverId,
      serverName: serverName,
      roleId: roleId,
    });
  });
}

/**
 * Get a user from the database
 * @param {string} dcid
 */
export async function getUser(dcid) {
  const user = await db
    .select({
      dcid: users.dcid,
      createdAt: users.createdAt,
      isBanned: users.isBanned,
    })
    .from(users)
    .where(eq(users.dcid, dcid))
    .limit(1);

  if (!user || user.length === 0) {
    return null;
  }

  return user[0];
}

/**
 * Update the user in the database
 * @param {string} dcid - The Discord ID
 * @param {{ key: keyof typeof users, value: any }} data
 * @returns {Promise<void>}
 */
export async function updateUser(dcid, { key, value }) {
  await db
    .update(users)
    .set({ [key]: value })
    .where(eq(users.dcid, dcid));
}

/**
 * Delete a user from the database
 * @param {string} dcid - The Discord ID
 * @returns {Promise<void>}
 */
export async function deleteUser(dcid) {
  await db.delete(users).where(eq(users.dcid, dcid));
}

/**
 * Get all dcid from the database
 */
export async function getAllUsers() {
  return await db.select({ dcid: users.dcid }).from(users);
}

/**
 * Get an account from the database matching the dcid
 * @param {string} dcid - The Discord ID
 */
export async function getAccount(dcid) {
  const account = await db
    .select({
      id: accounts.id,
      dcid: accounts.dcid,
      addedOn: accounts.addedOn,
      nickname: accounts.nickname,
      accountToken: accounts.accountToken,
      hgId: accounts.hgId,
      userId: accounts.userId,
      roleId: accounts.roleId,
      channelId: accounts.channelId,
      serverType: accounts.serverType,
      serverId: accounts.serverId,
      serverName: accounts.serverName,
      isPrivate: accounts.isPrivate,
      enableNotif: accounts.enableNotif,
      enableSignin: accounts.enableSignin,
    })
    .from(accounts)
    .where(eq(accounts.dcid, dcid));

  if (!account || account.length === 0) {
    return null;
  }

  return account[0];
}

/**
 * Get all accounts from the database matching the dcid
 * @param {string} dcid - The Discord ID
 */
export async function getAllAccounts(dcid) {
  return await db.select({ dcid: accounts.dcid }).from(accounts).where(eq(accounts.dcid, dcid));
}

/**
 * Update an account in the database matching the dcid and aid
 * @param {string} dcid - The Discord ID
 * @param {string} aid - The Account ID
 * @param {{ key: keyof typeof accounts, value: any }} data
 */
export async function updateAccount(dcid, aid, { key, value }) {
  await db
    .update(accounts)
    .set({ [key]: value })
    .where(and(eq(accounts.dcid, dcid), eq(accounts.id, aid)));
}

/**
 * Create an event in the database
 * @param {string} dcid - The Discord ID
 * @param {{ interaction: string, metadata?: { [key: string]: any } | null }} param0
 * @returns {Promise<void>}
 */
export async function createEvent(dcid, { interaction, metadata = null }) {
  await db.insert(events).values({ dcid, interaction, metadata });
}

/**
 * Get all dcid from the database where enableSignin is true
 */
export async function getAllUsersWithAttendance() {
  return await db
    .select({ dcid: accounts.dcid })
    .from(accounts)
    .where(eq(accounts.enableSignin, true));
}

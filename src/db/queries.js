import { eq } from 'drizzle-orm';
import { db } from './index.js';
import { events, skport, users } from './schema.js';

/**
 * Add the newly logged in user to the database
 * @param {string} dcid
 * @param {{ email: string, serverName: string, cred: string, userId: string, cToken: string, serverId: string, roleId: string, loginToken: string, hgId: string, oauthCode: string, oathUid: string }} data
 * @returns {Promise<void>}
 */
export async function createUser(
  dcid,
  {
    email,
    serverName,
    cred,
    userId,
    cToken,
    serverId,
    roleId,
    loginToken,
    hgId,
    oauthCode,
    oathUid,
  }
) {
  await db.transaction(async (tx) => {
    await tx.insert(users).values({ dcid }).onConflictDoNothing();
    await tx.insert(skport).values({
      email,
      serverName,
      dcid,
      cred,
      userId,
      cToken,
      serverId,
      roleId,
      loginToken,
      hgId,
      oauthCode,
      oathUid,
    });
  });
}

/**
 * Get a user from the database
 * @param {string} dcid
 * @returns {Promise<{
 *   dcid: string,
 *   createdAt: string,
 *   isPrivate: boolean,
 *   notifyAttendance: boolean,
 *   enableAttendance: boolean,
 *   isBanned: boolean,
 *   serverId: string,
 *   roleId: string,
 *   userId: string,
 *   cred: string,
 *   cToken: string,
 *   loginToken: string,
 *   hgId: string,
 *   oauthCode: string,
 *   oathUid: string,
 *   email: string,
 *   serverName: string
 * } | null>}
 */
export async function getUser(dcid) {
  const user = await db
    .select({
      dcid: users.dcid,
      createdAt: users.createdAt,
      isPrivate: users.isPrivate,
      notifyAttendance: users.notifyAttendance,
      enableAttendance: users.enableAttendance,
      isBanned: users.isBanned,
      serverId: skport.serverId,
      roleId: skport.roleId,
      userId: skport.userId,
      cred: skport.cred,
      cToken: skport.cToken,
      loginToken: skport.loginToken,
      hgId: skport.hgId,
      oauthCode: skport.oauthCode,
      oathUid: skport.oathUid,
      email: skport.email,
      serverName: skport.serverName,
    })
    .from(users)
    .innerJoin(skport, eq(users.dcid, skport.dcid))
    .where(eq(users.dcid, dcid))
    .limit(1);

  if (!user || user.length === 0) {
    return null;
  }

  return user[0];
}

/**
 * Update the user in the database
 * @param {string} dcid
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
 * @param {string} dcid
 * @returns {Promise<void>}
 */
export async function deleteUser(dcid) {
  await db.delete(users).where(eq(users.dcid, dcid));
}

/**
 * Create an event in the database
 * @param {string} dcid
 * @param {{ interaction: string, metadata?: { [key: string]: any } | null }} param0
 * @returns {Promise<void>}
 */
export async function createEvent(dcid, { interaction, metadata = null }) {
  await db.insert(events).values({ dcid, interaction, metadata });
}

/**
 *
 * @param {string} dcid
 * @returns
 */
export async function getSkportUser(dcid) {
  const skportData = await db
    .select({
      userId: skport.userId,
      roleId: skport.roleId,
      serverId: skport.serverId,
      loginToken: skport.loginToken,
      cred: skport.cred,
      cToken: skport.cToken,
      hgId: skport.hgId,
      oauthCode: skport.oauthCode,
      oathUid: skport.oathUid,
      email: skport.email,
      serverName: skport.serverName,
    })
    .from(skport)
    .where(eq(skport.dcid, dcid));

  if (!skportData || skportData.length === 0) {
    return null;
  }

  return skportData[0];
}

export async function getAllUsersWithAttendance() {
  return await db
    .select({
      dcid: users.dcid,
      isPrivate: users.isPrivate,
      notifyAttendance: users.notifyAttendance,
      enableAttendance: users.enableAttendance,
    })
    .from(users)
    .where(eq(users.enableAttendance, true));
}

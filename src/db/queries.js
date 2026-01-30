import { eq } from 'drizzle-orm';
import { db } from './index.js';
import { events, skport, users } from './schema.js';

/**
 * Add the newly logged in user to the database
 * @param {string} dcid
 * @param {{ email: string, cred: string, userId: string, cToken: string, serverId: string, roleId: string, lToken: string, hgId: string, oauthCode: string, oathUid: string }} data
 * @returns {Promise<void>}
 */
export async function createUser(
  dcid,
  { email, cred, userId, cToken, serverId, roleId, lToken, hgId, oauthCode, oathUid }
) {
  await db.transaction(async (tx) => {
    await tx.insert(users).values({ dcid }).onConflictDoNothing();
    await tx.insert(skport).values({
      email,
      dcid,
      cred,
      userId,
      cToken,
      serverId,
      roleId,
      lToken,
      hgId,
      oauthCode,
      oathUid,
    });
  });
}

/**
 * Get a user from the database
 * @param {string} dcid
 * @returns {Promise<{ dcid: string, createdAt: string, isPrivate: boolean, notifyAttendance: boolean, enableAttendance: boolean, isBanned: boolean } | null>}
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

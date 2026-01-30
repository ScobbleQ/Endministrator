import { eq } from 'drizzle-orm';
import { db } from './index.js';
import { skport, users } from './schema.js';

/**
 *
 * @param {string} dcid
 * @param {{ token: string, cred: string, serverId: string, roleId: string }} data
 * @returns {Promise<void>}
 */
export async function addUser(dcid, { token, cred, serverId, roleId }) {
  await db.transaction(async (tx) => {
    await tx.insert(users).values({ dcid }).onConflictDoNothing();
    await tx.insert(skport).values({
      dcid,
      cred,
      userId: '',
      token,
      serverId,
      roleId,
    });
  });
}

/**
 *
 * @param {string} dcid
 * @returns {Promise<void>}
 */
export async function deleteUser(dcid) {
  await db.transaction(async (tx) => {
    await tx.delete(users).where(eq(users.dcid, dcid));
    await tx.delete(skport).where(eq(skport.dcid, dcid));
  });
}

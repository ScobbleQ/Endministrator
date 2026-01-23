import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { BotConfig } from '../../config.js';

const client = postgres(BotConfig.databaseUrl);
export const db = drizzle(client);

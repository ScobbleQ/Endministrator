import { ShardingManager } from 'discord.js';
import { BotConfig } from './config.js';

const manager = new ShardingManager('./src/bot.js', {
  token: BotConfig.token,
});

manager.on('shardCreate', (shard) => {
  console.info(`[Discord] Launched shard ${shard.id}`);
});

manager.spawn().catch((error) => {
  console.error('[Discord] Error spawning shards:', error);
});

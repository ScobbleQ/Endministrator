import axios from 'axios';
import { createCache, getOrSet } from '../../util/cache.js';

/** @typedef {import('../../util/typedef.js').WikiApiResponse} WikiApiResponse */

// Cache for weapons data (1 week TTL)
const cache = createCache(7 * 24 * 60 * 60 * 1000);
const CACHE_KEY = 'weapons';

/**
 * Get all weapons from the API
 * @returns {Promise<WikiApiResponse[] | null>}
 * @example
 * const weapons = await getWeapons();
 * console.dir(weapons, { depth: null });
 */
export async function getWeapons() {
  /** @type {WikiApiResponse[] | null} */
  const weapons = await getOrSet(cache, CACHE_KEY, async () => {
    const url = 'https://zonai.skport.com/web/v1/wiki/item/catalog?typeMainId=1&typeSubId=2';
    const res = await axios.get(url);
    if (res.status !== 200 || res.data.code !== 0) {
      return null;
    }

    return res.data.data.catalog[0].typeSub[0].items;
  });

  // Failed to fetch weapons
  if (weapons === null) {
    return null;
  }

  // Return all weapons
  return weapons;
}

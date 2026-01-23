import axios from 'axios';
import { createCache, getOrSet } from '../../util/cache.js';

/** @typedef {import('../../util/typedef.js').WikiApiResponse} WikiApiResponse */

// Cache for operators data (1 week TTL)
const cache = createCache(7 * 24 * 60 * 60 * 1000);
const CACHE_KEY = 'operators';

/**
 * Get all operators from the API
 * @returns {Promise<WikiApiResponse[] | null>}
 * @example
 * const operators = await getOperators();
 * console.dir(operators, { depth: null });
 */
export async function getOperators() {
  /** @type {WikiApiResponse[] | null} */
  const operators = await getOrSet(cache, CACHE_KEY, async () => {
    const url = 'https://zonai.skport.com/web/v1/wiki/item/catalog?typeMainId=1&typeSubId=1';
    const res = await axios.get(url);
    if (res.status !== 200 || res.data.code !== 0) {
      return null;
    }

    return res.data.data.catalog[0].typeSub[0].items;
  });

  // Failed to fetch operators
  if (operators === null) {
    return null;
  }

  // Return all operators
  return operators;
}

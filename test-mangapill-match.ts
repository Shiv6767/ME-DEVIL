import { searchMangaPill } from './lib/scrapers/mangapill.ts';

async function test() {
  const query = "Solo Leveling";
  console.log(`Searching for ${query}...`);
  const results = await searchMangaPill(query);
  console.log('Search Results:', results.map(r => r.title));

  const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Exact match
  const exactMatch = results.find((m: any) => {
    const mTitle = m.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (m.title.toLowerCase().includes('novel') && !query.toLowerCase().includes('novel')) return false;
    return mTitle === normalizedQuery;
  });
  console.log('Exact match:', exactMatch?.title);

  // 2. Contains match
  const containsMatch = results.find((m: any) => {
    const mTitle = m.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (m.title.toLowerCase().includes('novel') && !query.toLowerCase().includes('novel')) return false;
    return mTitle.includes(normalizedQuery) || normalizedQuery.includes(mTitle);
  });
  console.log('Contains match:', containsMatch?.title);

  // 3. Fallback to first non-novel result
  const nonNovel = results.find((m: any) => !m.title.toLowerCase().includes('novel'));
  console.log('Non-novel fallback:', nonNovel?.title);

  console.log('Ultimate fallback:', results[0]?.title);
}

test();

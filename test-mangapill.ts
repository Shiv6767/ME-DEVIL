import { searchMangaPill, getMangaPillChapters, getMangaPillPages } from './lib/scrapers/mangapill';

async function test() {
  console.log('Searching for Kingdom...');
  const results = await searchMangaPill('Kingdom');
  console.log('Search Results:', results.slice(0, 3));

  if (results.length > 0) {
    console.log('\nFetching chapters for', results[0].title);
    const chapters = await getMangaPillChapters(results[0].id);
    console.log(`Found ${chapters.length} chapters. First 3:`, chapters.slice(0, 3));

    if (chapters.length > 0) {
      console.log('\nFetching pages for Chapter 1');
      const pages = await getMangaPillPages(chapters[0].id);
      console.log(`Found ${pages.length} pages. First 3:`, pages.slice(0, 3));
    }
  }
}

test();

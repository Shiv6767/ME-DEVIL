import * as cheerio from 'cheerio';

const BASE_URL = 'https://mangapill.com';

export interface ScrapedManga {
  id: string; // The path, e.g., /manga/1234/name
  title: string;
  thumbnailUrl: string;
}

export interface ScrapedChapter {
  id: string; // The path, e.g., /chapters/1234-1000000/name-chapter-1
  title: string;
  chapterNumber: string;
}

export async function searchMangaPill(query: string): Promise<ScrapedManga[]> {
  try {
    const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to fetch search results');

    const html = await res.text();
    const $ = cheerio.load(html);

    const results: ScrapedManga[] = [];

    // Keiyoushi selector: .grid > div:not([class])
    $('.grid > div:not([class])').each((_, el) => {
      const $el = $(el);
      const thumbnail = $el.find('img').attr('data-src') || '';
      const link = $el.find("a[href^='/manga/']").attr('href') || '';
      // The title might have newlines and sub-titles, so we take the first line
      const rawTitle = $el.find('a:not(:first-child) > div').text().trim() || $el.find('div[class] > a').text().trim();
      const title = rawTitle.split('\n')[0].trim();

      if (link && title) {
        results.push({
          id: link,
          title,
          thumbnailUrl: thumbnail
        });
      }
    });

    return results;
  } catch (err) {
    console.error('MangaPill search error:', err);
    return [];
  }
}

export async function getMangaPillChapters(mangaPath: string): Promise<ScrapedChapter[]> {
  try {
    const res = await fetch(`${BASE_URL}${mangaPath}`);
    if (!res.ok) throw new Error('Failed to fetch manga details');

    const html = await res.text();
    const $ = cheerio.load(html);

    const chapters: ScrapedChapter[] = [];

    // Keiyoushi selector: #chapters > div > a
    $('#chapters > div > a').each((_, el) => {
      const $el = $(el);
      const link = $el.attr('href') || '';
      const title = $el.text().trim();

      // Try to extract chapter number from title (e.g. "Chapter 123")
      const numMatch = title.match(/Chapter\s+([\d.]+)/i);
      const chapterNumber = numMatch ? numMatch[1] : '?';

      if (link) {
        chapters.push({
          id: link,
          title,
          chapterNumber
        });
      }
    });

    // Mangapill lists chapters newest first, we want oldest first
    return chapters.reverse();
  } catch (err) {
    console.error('MangaPill chapters error:', err);
    return [];
  }
}

export async function getMangaPillPages(chapterPath: string): Promise<string[]> {
  try {
    const res = await fetch(`${BASE_URL}${chapterPath}`);
    if (!res.ok) throw new Error('Failed to fetch chapter pages');

    const html = await res.text();
    const $ = cheerio.load(html);

    const pages: string[] = [];

    // Keiyoushi selector: picture img
    $('picture img').each((_, el) => {
      const src = $(el).attr('data-src');
      if (src) pages.push(src);
    });

    return pages;
  } catch (err) {
    console.error('MangaPill pages error:', err);
    return [];
  }
}

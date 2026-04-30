import * as cheerio from 'cheerio';

const BASE_URL = 'https://asurascans.com';

export interface ScrapedManga {
  id: string;
  title: string;
  thumbnailUrl: string;
}

export interface ScrapedChapter {
  id: string;
  title: string;
  chapterNumber: string;
}

export async function searchAsuraScans(query: string): Promise<ScrapedManga[]> {
  try {
    // Note: Asura might require headers or have Cloudflare protection.
    // In a real scenario, this might need a proxy or a specialized fetcher.
    const res = await fetch(`${BASE_URL}/browse?search=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to fetch search results');

    const html = await res.text();
    const $ = cheerio.load(html);

    const results: ScrapedManga[] = [];

    // Based on test-asura-parse.ts verified logic
    $('a[href*="/comics/"], a[href*="/series/"]').each((_, el) => {
      const a = $(el);
      const href = a.attr('href');
      if (!href) return;

      const id = href.includes('/series/') ? href.replace('/series/', '') : href.replace('/comics/', '');
      if (results.find(r => r.id === id)) return;

      let title = a.find('h3').text().trim() ||
        a.find('span.font-bold').text().trim() ||
        a.find('.text-[13px]').text().trim();

      if (!title) {
        const parent = a.parent();
        title = parent.find('h3').text().trim() ||
          parent.find('span.font-bold').text().trim() ||
          parent.find('.text-[13px]').text().trim();
      }

      const thumbnail = a.find('img').attr('src') || '';

      if (href && title && !title.toLowerCase().includes('chapter')) {
        results.push({
          id,
          title,
          thumbnailUrl: thumbnail
        });
      }
    });

    return results;
  } catch (err) {
    console.error('Asura Scans search error:', err);
    return [];
  }
}

export async function getAsuraScansChapters(mangaId: string): Promise<ScrapedChapter[]> {
  try {
    const url = mangaId.startsWith('/') ? `${BASE_URL}${mangaId}` : `${BASE_URL}/comics/${mangaId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch manga details');

    const html = await res.text();
    const $ = cheerio.load(html);

    const chapters: ScrapedChapter[] = [];

    // Asura Scans chapter list structure (usually in a list or grid)
    // We look for links containing /chapter/
    $('a[href*="/chapter/"]').each((_, el) => {
      const a = $(el);
      const href = a.attr('href') || '';

      // Try to find a specific span/div for the chapter name to avoid merging with dates
      // In the new layout, the chapter title is often in a specific child element
      const titleText = a.find('span, p, div').first().text().trim() || a.text().trim();

      // Skip navigational links
      if (titleText.toLowerCase().includes('first chapter') ||
        titleText.toLowerCase().includes('latest chapter') ||
        titleText.toLowerCase().includes('read first') ||
        titleText.toLowerCase().includes('read latest')) {
        return;
      }

      const numMatch = titleText.match(/Chapter\s+([\d.]+)/i);
      const chapterNumber = numMatch ? numMatch[1] : '?';

      // Clean up title: if it's just "Chapter 123SomethingElse", make it "Chapter 123"
      const cleanTitle = numMatch ? `Chapter ${chapterNumber}` : titleText;

      if (href && !chapters.find(c => c.id === href)) {
        chapters.push({
          id: href,
          title: cleanTitle,
          chapterNumber
        });
      }
    });

    // Sort chapters descending by number (newest first)
    return chapters.sort((a, b) => {
      const numA = parseFloat(a.chapterNumber);
      const numB = parseFloat(b.chapterNumber);
      if (isNaN(numA) || isNaN(numB)) return 0;
      return numB - numA;
    });
  } catch (err) {
    console.error('Asura Scans chapters error:', err);
    return [];
  }
}

export async function getAsuraScansPages(chapterPath: string): Promise<string[]> {
  try {
    const url = chapterPath.startsWith('http') ? chapterPath : `${BASE_URL}${chapterPath}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch chapter pages');

    const html = await res.text();
    const $ = cheerio.load(html);

    const pages: string[] = [];

    // Asura Scans pages are typically images in a specific reader container
    // We look for images in the reader section
    $('#readerarea img, .rd-area img, .reader-area img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && src.startsWith('http')) {
        pages.push(src);
      }
    });

    return pages;
  } catch (err) {
    console.error('Asura Scans pages error:', err);
    return [];
  }
}

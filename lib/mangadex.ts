const MANGADEX_API = 'https://api.mangadex.org';

export interface MangaDexManga {
  id: string;
  attributes: {
    title: Record<string, string>;
    altTitles: Record<string, string>[];
    description: Record<string, string>;
  };
}

export interface MangaDexChapter {
  id: string;
  attributes: {
    volume: string | null;
    chapter: string | null;
    title: string | null;
    translatedLanguage: string;
    pages: number;
    publishAt: string;
    externalUrl: string | null;
  };
  relationships: {
    id: string;
    type: string;
    attributes?: {
      name?: string;
    };
  }[];
}

export interface ChapterPages {
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
}

// All content ratings to avoid missing any manga
const ALL_CONTENT_RATINGS = 'contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic';

/**
 * Search MangaDex for a manga by title - tries multiple title variants
 */
export async function searchMangaDex(titles: string[]): Promise<MangaDexManga | null> {
  // Filter out empty/duplicate titles
  const uniqueTitles = [...new Set(titles.filter(t => t && t.trim().length > 0))];

  for (const title of uniqueTitles) {
    try {
      const res = await fetch(
        `${MANGADEX_API}/manga?title=${encodeURIComponent(title)}&limit=10&${ALL_CONTENT_RATINGS}&includes[]=cover_art&hasAvailableChapters=true`
      );

      if (!res.ok) continue;
      const data = await res.json();

      if (!data.data || data.data.length === 0) continue;

      // Try to find an exact or close match
      const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');

      // 1. Exact match on primary title
      const exactMatch = data.data.find((m: MangaDexManga) => {
        const mdTitle = (m.attributes.title?.en || m.attributes.title?.['ja-ro'] || Object.values(m.attributes.title)[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return mdTitle === normalizedTitle;
      });
      if (exactMatch) return exactMatch;

      // 2. Exact match on alt titles
      const altMatch = data.data.find((m: MangaDexManga) => {
        return m.attributes.altTitles?.some(alt => {
          const altTitle = (Object.values(alt)[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return altTitle === normalizedTitle;
        });
      });
      if (altMatch) return altMatch;

      // 3. Contains match (either direction)
      const containsMatch = data.data.find((m: MangaDexManga) => {
        const mdTitle = (m.attributes.title?.en || m.attributes.title?.['ja-ro'] || Object.values(m.attributes.title)[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return mdTitle.includes(normalizedTitle) || normalizedTitle.includes(mdTitle);
      });
      if (containsMatch) return containsMatch;

      // 4. Just take the first result from MangaDex (it ranks by relevance)
      return data.data[0];
    } catch (err) {
      console.error(`MangaDex search failed for "${title}":`, err);
      continue;
    }
  }

  return null;
}

/**
 * Get ALL chapters for a MangaDex manga (handles pagination automatically)
 */
export async function getChapters(
  mangaId: string
): Promise<{ chapters: MangaDexChapter[]; total: number }> {
  const allChapters: MangaDexChapter[] = [];
  let offset = 0;
  const limit = 500; // MangaDex max per request
  let total = 0;

  try {
    // Fetch in a loop to get ALL chapters
    while (true) {
      const res = await fetch(
        `${MANGADEX_API}/manga/${mangaId}/feed?` +
        `translatedLanguage[]=en&` +
        `order[chapter]=asc&` +
        `limit=${limit}&` +
        `offset=${offset}&` +
        `includes[]=scanlation_group&` +
        `${ALL_CONTENT_RATINGS}&` +
        `includeExternalUrl=1&` +
        `includeEmptyPages=1`
      );

      if (!res.ok) break;
      const data = await res.json();

      total = data.total || 0;
      const fetched = data.data || [];

      if (fetched.length === 0) break;

      allChapters.push(...fetched);
      offset += fetched.length;

      // If we got fewer than the limit, we've reached the end
      if (fetched.length < limit || offset >= total) break;

      // Safety limit: avoid infinite loops
      if (offset > 10000) break;
    }

    // Deduplicate: keep the chapter version with the most pages for each number
    const chapterMap = new Map<string, MangaDexChapter>();

    for (const ch of allChapters) {
      const key = ch.attributes.chapter || ch.id;
      const existing = chapterMap.get(key);

      if (!existing) {
        chapterMap.set(key, ch);
      } else {
        // Prefer the version with more pages (better reading experience)
        if (ch.attributes.pages > existing.attributes.pages) {
          chapterMap.set(key, ch);
        }
      }
    }

    // Sort by chapter number
    const deduped = Array.from(chapterMap.values()).sort((a, b) => {
      const numA = parseFloat(a.attributes.chapter || '0');
      const numB = parseFloat(b.attributes.chapter || '0');
      return numA - numB;
    });

    return {
      chapters: deduped,
      total: deduped.length,
    };
  } catch (err) {
    console.error('MangaDex chapters fetch failed:', err);
    return { chapters: [], total: 0 };
  }
}

/**
 * Get page URLs for a specific chapter
 */
export async function getChapterPages(chapterId: string): Promise<string[]> {
  try {
    const res = await fetch(`${MANGADEX_API}/at-home/server/${chapterId}`);

    if (!res.ok) return [];
    const data: ChapterPages = await res.json();

    if (!data.chapter) return [];

    // Use data-saver for faster loading
    const pages = data.chapter.dataSaver.map(
      (filename) => `${data.baseUrl}/data-saver/${data.chapter.hash}/${filename}`
    );

    return pages;
  } catch (err) {
    console.error('MangaDex pages fetch failed:', err);
    return [];
  }
}

/**
 * Get full quality page URLs for a specific chapter
 */
export async function getChapterPagesHQ(chapterId: string): Promise<string[]> {
  try {
    const res = await fetch(`${MANGADEX_API}/at-home/server/${chapterId}`);

    if (!res.ok) return [];
    const data: ChapterPages = await res.json();

    if (!data.chapter) return [];

    const pages = data.chapter.data.map(
      (filename) => `${data.baseUrl}/data/${data.chapter.hash}/${filename}`
    );

    return pages;
  } catch (err) {
    console.error('MangaDex HQ pages fetch failed:', err);
    return [];
  }
}

/**
 * Generate external reading links for a manga title
 */
export function getExternalReadingSources(title: string) {
  const encoded = encodeURIComponent(title);
  return [
    {
      name: 'MangaDex',
      url: `https://mangadex.org/search?q=${encoded}`,
      color: '#ff6740',
      icon: '📖',
    },
    {
      name: 'MangaFire',
      url: `https://mangafire.to/filter?keyword=${encoded}`,
      color: '#ff4500',
      icon: '🔥',
    },
    {
      name: 'MangaPill',
      url: `https://mangapill.com/search?q=${encoded}`,
      color: '#6366f1',
      icon: '💊',
    },
    {
      name: 'Bato.to',
      url: `https://bato.to/search?word=${encoded}`,
      color: '#10b981',
      icon: '🦇',
    },
    {
      name: 'MangaHasu',
      url: `https://mangahasu.se/search/advance?keyword=${encoded}`,
      color: '#f59e0b',
      icon: '📚',
    },
    {
      name: 'LikeManga',
      url: `https://www.likemanga.io/search?search=${encoded}`,
      color: '#ec4899',
      icon: '❤️',
    },
  ];
}

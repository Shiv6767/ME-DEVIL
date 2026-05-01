import { MangaDexChapter, searchMangaDex, getChapters, getChapterPages } from './mangadex';

export type SourceId =
  | 'mangadex'
  | 'mangapill'
  | 'mangahere';

export interface UnifiedChapter {
  id: string; // Original ID from the source
  sourceId: SourceId;
  chapterNumber: string;
  title: string;
  pages?: number;
  scanlationGroup?: string;
  externalUrl?: string | null;
}

export interface UnifiedSource {
  id: SourceId;
  name: string;
}

export const AVAILABLE_SOURCES: UnifiedSource[] = [
  { id: 'mangadex', name: 'MangaDex' },
  { id: 'mangapill', name: 'MangaPill' },
  { id: 'mangahere', name: 'MangaHere' },
];

/**
 * Search for a manga on a given source using title variants.
 * Returns the source-specific manga ID if found, or null.
 */
export async function searchManga(titleVariants: string[], source: SourceId): Promise<string | null> {
  if (source === 'mangadex') {
    const result = await searchMangaDex(titleVariants);
    return result ? result.id : null;
  }
  
  if (source === 'mangapill') {
    return searchViaScraper('/api/scrape/mangapill', titleVariants);
  }
  
  if (source === 'mangahere') {
    return searchViaScraper('/api/scrape/mangahere', titleVariants);
  }

  return null;
}

/**
 * Generic search helper for scraper-based sources.
 * Tries each title variant and uses fuzzy matching to find the best result.
 */
async function searchViaScraper(apiPath: string, titleVariants: string[]): Promise<string | null> {
  for (const title of titleVariants) {
    try {
      const res = await fetch(`${apiPath}?action=search&query=${encodeURIComponent(title)}`);
      if (!res.ok) continue;
      
      const data = await res.json();
      if (!data.results || data.results.length === 0) continue;

      const normalizedQuery = title.toLowerCase().replace(/[^a-z0-9]/g, '');

      // 1. Exact match
      const exactMatch = data.results.find((m: any) => {
        const mTitle = m.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (m.title.toLowerCase().includes('novel') && !title.toLowerCase().includes('novel')) return false;
        return mTitle === normalizedQuery;
      });
      if (exactMatch) return exactMatch.id;

      // 2. Contains match
      const containsMatch = data.results.find((m: any) => {
        const mTitle = m.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (m.title.toLowerCase().includes('novel') && !title.toLowerCase().includes('novel')) return false;
        return mTitle.includes(normalizedQuery) || normalizedQuery.includes(mTitle);
      });
      if (containsMatch) return containsMatch.id;

      // 3. Fallback to first non-novel result
      const nonNovel = data.results.find((m: any) => !m.title.toLowerCase().includes('novel'));
      if (nonNovel) return nonNovel.id;

      // 4. Ultimate fallback
      return data.results[0].id;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Get all chapters for a manga from the given source.
 */
export async function getUnifiedChapters(mangaId: string, source: SourceId): Promise<UnifiedChapter[]> {
  if (source === 'mangadex') {
    const result = await getChapters(mangaId);
    return result.chapters.map((ch: MangaDexChapter) => {
      const group = ch.relationships?.find((r) => r.type === 'scanlation_group');
      return {
        id: ch.id,
        sourceId: 'mangadex' as SourceId,
        chapterNumber: ch.attributes.chapter || '?',
        title: ch.attributes.title || `Chapter ${ch.attributes.chapter || '?'}`,
        pages: ch.attributes.pages,
        scanlationGroup: group?.attributes?.name,
        externalUrl: ch.attributes.externalUrl,
      };
    });
  }
  
  if (source === 'mangapill') {
    return fetchChaptersFromScraper('/api/scrape/mangapill', mangaId, 'mangapill');
  }
  
  if (source === 'mangahere') {
    return fetchChaptersFromScraper('/api/scrape/mangahere', mangaId, 'mangahere');
  }

  return [];
}

/**
 * Generic chapter fetcher for scraper-based sources.
 */
async function fetchChaptersFromScraper(apiPath: string, mangaId: string, sourceId: SourceId): Promise<UnifiedChapter[]> {
  try {
    const res = await fetch(`${apiPath}?action=chapters&path=${encodeURIComponent(mangaId)}`);
    if (!res.ok) return [];
    
    const data = await res.json();
    if (!data.chapters) return [];
    
    return data.chapters.map((ch: any) => ({
      id: ch.id,
      sourceId,
      chapterNumber: ch.chapterNumber,
      title: ch.title,
      pages: 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Get all page image URLs for a chapter.
 */
export async function getUnifiedChapterPages(chapterId: string, source: SourceId): Promise<string[]> {
  if (source === 'mangadex') {
    return await getChapterPages(chapterId);
  }
  
  if (source === 'mangapill') {
    return fetchPagesFromScraper('/api/scrape/mangapill', chapterId, 'mangapill');
  }

  if (source === 'mangahere') {
    return fetchPagesFromScraper('/api/scrape/mangahere', chapterId, 'mangahere');
  }

  return [];
}

/**
 * Generic page fetcher for scraper-based sources.
 * Automatically proxies images that need referer headers.
 */
async function fetchPagesFromScraper(apiPath: string, chapterId: string, source: string): Promise<string[]> {
  try {
    const res = await fetch(`${apiPath}?action=pages&path=${encodeURIComponent(chapterId)}`);
    if (!res.ok) return [];
    
    const data = await res.json();
    const pages: string[] = data.pages || [];
    
    // Proxy images to bypass referer/hotlink restrictions
    return pages.map((url: string) =>
      `/api/proxy/image?source=${source}&url=${encodeURIComponent(url)}`
    );
  } catch {
    return [];
  }
}

import { MangaDexChapter, searchMangaDex, getChapters, getChapterPages } from './mangadex';

export type SourceId =
  | 'mangadex'
  | 'mangapill'
  | 'aquamanga'
  | 'asurascans'
  | 'comick'
  | 'comix'
  | 'likemanga'
  | 'mangafire'
  | 'mangageko'
  | 'weebcentral'
  | 'ravenscans';

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
  { id: 'mangapill', name: 'MangaPill (Extension)' },
  { id: 'aquamanga', name: 'Aqua Manga (Extension)' },
  { id: 'asurascans', name: 'Asura Scans (Extension)' },
  { id: 'comick', name: 'ComicK (Extension)' },
  { id: 'comix', name: 'Comix (Extension)' },
  { id: 'likemanga', name: 'LikeManga (Extension)' },
  { id: 'mangafire', name: 'MangaFire (Extension)' },
  { id: 'mangageko', name: 'MangaGeko (Extension)' },
  { id: 'weebcentral', name: 'WeebCentral (Extension)' },
  { id: 'ravenscans', name: 'RavenScans (Extension)' },
];

export async function searchManga(titleVariants: string[], source: SourceId) {
  if (source === 'mangadex') {
    const result = await searchMangaDex(titleVariants);
    return result ? result.id : null;
  } else if (source === 'mangapill') {
    // Try each title variant until we find a match
    for (const title of titleVariants) {
      const res = await fetch(`/api/scrape/mangapill?action=search&query=${encodeURIComponent(title)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const normalizedQuery = title.toLowerCase().replace(/[^a-z0-9]/g, '');

          // 1. Exact match
          const exactMatch = data.results.find((m: any) => {
            const mTitle = m.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            // Prevent picking "Novel" versions if we're looking for manga
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
        }
      }
    }
    return null;
  } else if (source === 'asurascans') {
    // Try each title variant until we find a match
    for (const title of titleVariants) {
      const res = await fetch(`/api/scrape/asurascans?action=search&query=${encodeURIComponent(title)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const normalizedQuery = title.toLowerCase().replace(/[^a-z0-9]/g, '');

          // 1. Exact match
          const exactMatch = data.results.find((m: any) => {
            const mTitle = m.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            return mTitle === normalizedQuery;
          });
          if (exactMatch) return exactMatch.id;

          // 2. Contains match
          const containsMatch = data.results.find((m: any) => {
            const mTitle = m.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            return mTitle.includes(normalizedQuery) || normalizedQuery.includes(mTitle);
          });
          if (containsMatch) return containsMatch.id;

          // 3. Fallback
          return data.results[0].id;
        }
      }
    }
    return null;
  }
  return null;
}

export async function getUnifiedChapters(mangaId: string, source: SourceId): Promise<UnifiedChapter[]> {
  if (source === 'mangadex') {
    const result = await getChapters(mangaId);
    return result.chapters.map((ch: MangaDexChapter) => {
      const group = ch.relationships?.find((r) => r.type === 'scanlation_group');
      return {
        id: ch.id,
        sourceId: 'mangadex',
        chapterNumber: ch.attributes.chapter || '?',
        title: ch.attributes.title || `Chapter ${ch.attributes.chapter || '?'}`,
        pages: ch.attributes.pages,
        scanlationGroup: group?.attributes?.name,
        externalUrl: ch.attributes.externalUrl,
      };
    });
  } else if (source === 'mangapill') {
    const res = await fetch(`/api/scrape/mangapill?action=chapters&path=${encodeURIComponent(mangaId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.chapters) {
        return data.chapters.map((ch: any) => ({
          id: ch.id,
          sourceId: 'mangapill',
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          pages: 0, // MangaPill doesn't provide page count upfront
        }));
      }
    }
    return [];
  } else if (source === 'asurascans') {
    const res = await fetch(`/api/scrape/asurascans?action=chapters&path=${encodeURIComponent(mangaId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.chapters) {
        return data.chapters.map((ch: any) => ({
          id: ch.id,
          sourceId: 'asurascans',
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          pages: 0,
        }));
      }
    }
    return [];
  }
  return [];
}

export async function getUnifiedChapterPages(chapterId: string, source: SourceId): Promise<string[]> {
  if (source === 'mangadex') {
    return await getChapterPages(chapterId);
  } else if (source === 'mangapill') {
    const res = await fetch(`/api/scrape/mangapill?action=pages&path=${encodeURIComponent(chapterId)}`);
    if (res.ok) {
      const data = await res.json();
      // Proxy MangaPill images to bypass referer restrictions
      return (data.pages || []).map((url: string) =>
        `/api/proxy/image?source=mangapill&url=${encodeURIComponent(url)}`
      );
    }
    return [];
  } else if (source === 'asurascans') {
    const res = await fetch(`/api/scrape/asurascans?action=pages&path=${encodeURIComponent(chapterId)}`);
    if (res.ok) {
      const data = await res.json();
      return (data.pages || []);
    }
    return [];
  }
  return [];
}

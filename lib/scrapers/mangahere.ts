import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.mangahere.cc';

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

export async function searchMangaHere(query: string): Promise<ScrapedManga[]> {
  try {
    const res = await fetch(`${BASE_URL}/search?title=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!res.ok) throw new Error('Failed to fetch search results');

    const html = await res.text();
    const $ = cheerio.load(html);

    const results: ScrapedManga[] = [];

    // MangaHere search results: only take manga listing links (ending with /)
    $('a[href*="/manga/"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const title = $(el).attr('title') || $(el).text().trim();
      
      if (href.match(/^\/manga\/[^/]+\/$/) && title && title.length > 1 && title.length < 100) {
        if (!results.find(r => r.id === href)) {
          const img = $(el).find('img').attr('src') || '';
          results.push({
            id: href,
            title,
            thumbnailUrl: img
          });
        }
      }
    });

    return results;
  } catch (err) {
    console.error('MangaHere search error:', err);
    return [];
  }
}

export async function getMangaHereChapters(mangaPath: string): Promise<ScrapedChapter[]> {
  try {
    const url = mangaPath.startsWith('http') ? mangaPath : `${BASE_URL}${mangaPath}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!res.ok) throw new Error('Failed to fetch manga details');

    const html = await res.text();
    const $ = cheerio.load(html);

    const chapters: ScrapedChapter[] = [];
    
    const slugMatch = mangaPath.match(/\/manga\/([^/]+)/);
    const slug = slugMatch ? slugMatch[1] : '';

    $('a[href*="/manga/"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes(`/manga/${slug}/c`) && href.endsWith('/1.html')) {
        const numMatch = href.match(/\/c(\d+)\//);
        const chapterNumber = numMatch ? String(parseInt(numMatch[1])) : '?';
        
        if (!chapters.find(c => c.id === href)) {
          chapters.push({
            id: href,
            title: `Chapter ${chapterNumber}`,
            chapterNumber
          });
        }
      }
    });

    // Sort ascending
    return chapters.sort((a, b) => {
      const numA = parseFloat(a.chapterNumber);
      const numB = parseFloat(b.chapterNumber);
      if (isNaN(numA) || isNaN(numB)) return 0;
      return numA - numB;
    });
  } catch (err) {
    console.error('MangaHere chapters error:', err);
    return [];
  }
}

/**
 * Get pages for a MangaHere chapter by decoding the chapterfun.ashx packed JS responses.
 */
export async function getMangaHerePages(chapterPath: string): Promise<string[]> {
  try {
    const pageUrl = chapterPath.startsWith('http') ? chapterPath : `${BASE_URL}${chapterPath}`;
    
    // Get the chapter page to extract metadata
    const res = await fetch(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!res.ok) throw new Error('Failed to fetch chapter page');

    const html = await res.text();
    
    const chapterIdMatch = html.match(/chapterid\s*=\s*(\d+)/);
    const imageCountMatch = html.match(/imagecount\s*=\s*(\d+)/);
    
    if (!chapterIdMatch || !imageCountMatch) {
      console.error('Could not extract chapter metadata from MangaHere');
      return [];
    }
    
    const chapterId = chapterIdMatch[1];
    const imageCount = parseInt(imageCountMatch[1]);
    
    // Extract the API base path (e.g., /manga/solo_leveling/c001)
    const pathMatch = chapterPath.match(/(\/manga\/[^/]+\/c\d+)\//);
    const apiBasePath = pathMatch ? pathMatch[1] : '';
    if (!apiBasePath) return [];
    
    const allPages: string[] = [];
    
    // Each API call returns 2 pages. Call for pages 1, 3, 5, 7, ...
    for (let page = 1; page <= imageCount; page += 2) {
      try {
        const apiUrl = `${BASE_URL}${apiBasePath}/chapterfun.ashx?cid=${chapterId}&page=${page}&key=`;
        const apiRes = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': pageUrl,
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        if (!apiRes.ok) continue;
        const jsCode = await apiRes.text();
        
        const urls = decodePacked(jsCode);
        allPages.push(...urls);
      } catch {
        // Skip failed requests
      }
    }
    
    return allPages;
  } catch (err) {
    console.error('MangaHere pages error:', err);
    return [];
  }
}

/**
 * Decode the p,a,c,k packed JavaScript from MangaHere's chapterfun.ashx.
 * Returns an array of full image URLs.
 */
function decodePacked(packed: string): string[] {
  try {
    // Extract the packer parameters
    const match = packed.match(/\('([^']+)',\s*(\d+),\s*(\d+),\s*'([^']+)'\.split/);
    if (!match) return [];
    
    const p = match[1];
    const a = parseInt(match[2]);
    const c = parseInt(match[3]);
    const k = match[4].split('|');
    
    // Unpack: replace base-encoded tokens with dictionary values
    let decoded = p;
    for (let i = c - 1; i >= 0; i--) {
      if (k[i]) {
        const token = toBase(i, a);
        const regex = new RegExp('\\b' + token + '\\b', 'g');
        decoded = decoded.replace(regex, k[i]);
      }
    }
    
    // Extract the base path and file names from the decoded JS
    // Pattern: var pix="//cdn.domain/path"; var pvalue=["/file1.jpg","/file2.jpg"];
    const baseMatch = decoded.match(/pix\s*=\s*"([^"]+)"/);
    const filesMatch = decoded.match(/pvalue\s*=\s*\[(.*?)\]/);
    
    if (!baseMatch || !filesMatch) return [];
    
    const basePath = baseMatch[1];
    const fileList = filesMatch[1];
    
    // Parse file names from the array
    const files = fileList.match(/"([^"]+)"/g)?.map(f => f.replace(/"/g, '')) || [];
    
    // Build full URLs
    return files.map(file => `https:${basePath}${file}`);
  } catch {
    return [];
  }
}

function toBase(n: number, base: number): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  if (n < base) return chars[n];
  return toBase(Math.floor(n / base), base) + chars[n % base];
}

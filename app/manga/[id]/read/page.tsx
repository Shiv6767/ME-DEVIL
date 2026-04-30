'use client';

import { use, useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  BookOpen,
  ExternalLink,
  Search,
  Loader2,
  AlertCircle,
  Library,
} from 'lucide-react';

import fetcher, { JikanResponse, MangaNode, JIKAN_BASE_URL } from '@/lib/api';
import {
  getExternalReadingSources,
} from '@/lib/mangadex';
import {
  AVAILABLE_SOURCES,
  SourceId,
  UnifiedChapter,
  searchManga,
  getUnifiedChapters,
  getUnifiedChapterPages
} from '@/lib/manga-sources';
import { MangaReader } from '@/components/MangaReader';

type ReadState =
  | { type: 'chapters' }
  | { type: 'loading_pages'; chapterIndex: number }
  | { type: 'reading'; chapterIndex: number; pages: string[] };

export default function ReadMangaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const malId = parseInt(resolvedParams.id);

  // Fetch manga info from AniList
  const { data: mangaData } = useSWR<JikanResponse<MangaNode>>(
    malId ? `${JIKAN_BASE_URL}/manga/${malId}` : null,
    fetcher
  );

  const manga = mangaData?.data;
  const title = manga?.title || '';

  // Collect all title variants for better MangaDex search
  const titleVariants = [
    manga?.title_english,
    manga?.title_romaji,
    manga?.title,
    manga?.title_japanese,
  ].filter((t): t is string => !!t && t.trim().length > 0);

  // Source & Chapters State
  const [activeSource, setActiveSource] = useState<SourceId>('mangadex');
  const [sourceMangaId, setSourceMangaId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<UnifiedChapter[]>([]);
  const [totalChapters, setTotalChapters] = useState(0);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'found' | 'not_found'>('idle');
  const [chaptersLoading, setChaptersLoading] = useState(false);

  const [readState, setReadState] = useState<ReadState>({ type: 'chapters' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChapters, setFilteredChapters] = useState<UnifiedChapter[]>([]);

  // Search source for this manga using all title variants
  useEffect(() => {
    if (titleVariants.length === 0) return;

    const doSearch = async () => {
      setSearchStatus('searching');
      setChapters([]);
      setSourceMangaId(null);

      const resultId = await searchManga(titleVariants, activeSource);
      if (resultId) {
        setSourceMangaId(resultId);
        setSearchStatus('found');
      } else {
        setSearchStatus('not_found');
      }
    };

    doSearch();
  }, [title, activeSource]); // Re-search when title or source changes

  // Load ALL chapters when source manga ID is found
  useEffect(() => {
    if (!sourceMangaId) return;

    const loadChapters = async () => {
      setChaptersLoading(true);
      const fetchedChapters = await getUnifiedChapters(sourceMangaId, activeSource);
      setChapters(fetchedChapters);
      setTotalChapters(fetchedChapters.length);
      setChaptersLoading(false);
    };

    loadChapters();
  }, [sourceMangaId, activeSource]);

  // Filter chapters based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChapters(chapters);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredChapters(
        chapters.filter(
          (ch) =>
            (ch.chapterNumber && ch.chapterNumber.includes(q)) ||
            (ch.title && ch.title.toLowerCase().includes(q))
        )
      );
    }
  }, [chapters, searchQuery]);

  // Open a chapter for reading
  const openChapter = useCallback(async (index: number) => {
    const chapter = chapters[index];
    if (!chapter) return;

    // If chapter has an external URL (e.g. MangaPlus) and no embeddable pages
    if (chapter.externalUrl && chapter.pages === 0) {
      window.open(chapter.externalUrl, '_blank');
      return;
    }

    setReadState({ type: 'loading_pages', chapterIndex: index });

    const pages = await getUnifiedChapterPages(chapter.id, chapter.sourceId);

    if (pages.length === 0 && chapter.externalUrl) {
      // Fall back to external URL if no pages returned
      window.open(chapter.externalUrl, '_blank');
      setReadState({ type: 'chapters' });
      return;
    }

    setReadState({ type: 'reading', chapterIndex: index, pages });
  }, [chapters]);

  // Chapter navigation
  const goToNextChapter = useCallback(() => {
    if (readState.type === 'reading' && readState.chapterIndex < chapters.length - 1) {
      openChapter(readState.chapterIndex + 1);
    }
  }, [readState, chapters, openChapter]);

  const goToPrevChapter = useCallback(() => {
    if (readState.type === 'reading' && readState.chapterIndex > 0) {
      openChapter(readState.chapterIndex - 1);
    }
  }, [readState, chapters, openChapter]);

  const externalSources = title ? getExternalReadingSources(title) : [];

  // If the reader is open
  if (readState.type === 'reading') {
    const chapter = chapters[readState.chapterIndex];
    return (
      <MangaReader
        pages={readState.pages}
        chapterTitle={chapter?.title || ''}
        chapterNumber={chapter?.chapterNumber || null}
        onClose={() => setReadState({ type: 'chapters' })}
        onNextChapter={goToNextChapter}
        onPrevChapter={goToPrevChapter}
        hasNextChapter={readState.chapterIndex < chapters.length - 1}
        hasPrevChapter={readState.chapterIndex > 0}
      />
    );
  }

  // Loading pages overlay
  if (readState.type === 'loading_pages') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0b1622] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-[#3db4f2] animate-spin mx-auto" />
          <p className="text-sm text-[#9fadbd] font-semibold">Loading chapter pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/manga/${malId}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8ba0b2] hover:text-[#d3d5f3] transition-colors uppercase tracking-wider mb-6"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Details
        </Link>

        <div className="flex items-start gap-4">
          {manga?.images?.webp?.large_image_url && (
            <div className="w-16 h-20 relative rounded overflow-hidden shadow-lg flex-shrink-0 hidden sm:block">
              <img
                src={manga.images.webp.large_image_url}
                alt={manga.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {manga?.title || 'Loading...'}
            </h1>
            <p className="text-sm text-[#8ba0b2] mt-1 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Read Online
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Chapter List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Source Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 reader-scroll">
            <span className="text-sm font-bold text-[#a0b1c5] uppercase tracking-wider mr-2 shrink-0">Source:</span>
            {AVAILABLE_SOURCES.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSource(s.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeSource === s.id
                    ? 'bg-[#3db4f2] text-white'
                    : 'bg-[#151f2e] text-[#9fadbd] hover:bg-[#1a2a3a] hover:text-white'
                  }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Status Indicators */}
          {searchStatus === 'searching' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#151f2e] rounded-lg p-6 flex items-center gap-4"
            >
              <Loader2 className="h-5 w-5 text-[#3db4f2] animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#9fadbd]">Searching {AVAILABLE_SOURCES.find(s => s.id === activeSource)?.name}...</p>
                <p className="text-xs text-[#8ba0b2]">Looking for &quot;{title}&quot;</p>
              </div>
            </motion.div>
          )}

          {searchStatus === 'not_found' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#151f2e] rounded-lg p-6 space-y-3"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <p className="text-sm font-semibold text-[#9fadbd]">
                  Not found on {AVAILABLE_SOURCES.find(s => s.id === activeSource)?.name}
                </p>
              </div>
              <p className="text-xs text-[#8ba0b2]">
                This manga isn&apos;t available on the selected source. Try switching sources above or use the external links.
              </p>
            </motion.div>
          )}

          {/* Chapter List */}
          {searchStatus === 'found' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#a0b1c5] uppercase tracking-wider">
                  Chapters
                  {chapters.length > 0 && (
                    <span className="text-[#647380] ml-2">({chapters.length})</span>
                  )}
                </h2>
              </div>

              {/* Search/Filter */}
              {chapters.length > 10 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#647380]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chapter number or title..."
                    className="w-full bg-[#151f2e] rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#9fadbd] placeholder:text-[#647380] focus:outline-none focus:ring-1 focus:ring-[#3db4f2] transition-all"
                  />
                </div>
              )}

              {chaptersLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-[#151f2e] rounded-lg p-4 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-4 bg-[#1a2a3a] rounded" />
                        <div className="w-40 h-4 bg-[#1a2a3a] rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!chaptersLoading && filteredChapters.length === 0 && chapters.length > 0 && (
                <div className="bg-[#151f2e] rounded-lg p-6 text-center">
                  <p className="text-sm text-[#8ba0b2]">No chapters match your search</p>
                </div>
              )}

              {!chaptersLoading && chapters.length === 0 && (
                <div className="bg-[#151f2e] rounded-lg p-6 text-center space-y-2">
                  <Library className="h-8 w-8 text-[#3a4a5a] mx-auto" />
                  <p className="text-sm text-[#8ba0b2]">No chapters available on {AVAILABLE_SOURCES.find(s => s.id === activeSource)?.name}</p>
                  <p className="text-xs text-[#647380]">Try switching sources or use the external links</p>
                </div>
              )}

              {/* Chapter List Items */}
              <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1 reader-scroll">
                {filteredChapters.map((chapter, i) => {
                  const actualIndex = chapters.findIndex((c) => c.id === chapter.id);

                  return (
                    <motion.button
                      key={chapter.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.5) }}
                      onClick={() => openChapter(actualIndex)}
                      className="w-full text-left bg-[#151f2e] hover:bg-[#1a2a3a] rounded-lg px-4 py-3 transition-all group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-bold text-[#3db4f2] flex-shrink-0 w-16">
                          Ch. {chapter.chapterNumber || '?'}
                        </span>
                        <span className="text-sm text-[#9fadbd] truncate group-hover:text-white transition-colors">
                          {chapter.title || `Chapter ${chapter.chapterNumber || '?'}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        {chapter.externalUrl && chapter.pages === 0 && (
                          <span className="text-[10px] text-amber-400 font-semibold">External</span>
                        )}
                        {chapter.scanlationGroup && (
                          <span className="text-[10px] text-[#647380] truncate max-w-[100px] hidden sm:block">
                            {chapter.scanlationGroup}
                          </span>
                        )}
                        {chapter.pages ? (
                          <span className="text-[10px] text-[#647380]">
                            {chapter.pages}p
                          </span>
                        ) : null}
                        {chapter.externalUrl && chapter.pages === 0 ? (
                          <ExternalLink className="h-3.5 w-3.5 text-[#647380] group-hover:text-amber-400 transition-colors" />
                        ) : (
                          <BookOpen className="h-3.5 w-3.5 text-[#647380] group-hover:text-[#3db4f2] transition-colors" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - External Sources */}
        <div className="space-y-6">
          <div className="bg-[#151f2e] rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#a0b1c5] uppercase tracking-wider flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              External Sources
            </h3>
            <p className="text-xs text-[#647380]">
              Read on other platforms. Links open in a new tab.
            </p>
            <div className="space-y-2">
              {externalSources.map((source) => (
                <a
                  key={source.name}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#0b1622] hover:bg-[#1a2a3a] transition-all group"
                >
                  <span className="text-lg flex-shrink-0">{source.icon}</span>
                  <span className="text-sm font-semibold text-[#9fadbd] group-hover:text-white transition-colors flex-1">
                    {source.name}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-[#647380] group-hover:text-[#3db4f2] transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Reading Tips */}
          <div className="bg-[#151f2e] rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#a0b1c5] uppercase tracking-wider">
              Reader Controls
            </h3>
            <div className="space-y-2 text-xs text-[#8ba0b2]">
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-[#0b1622] rounded text-[10px] font-mono text-[#647380]">←</kbd>
                <kbd className="px-1.5 py-0.5 bg-[#0b1622] rounded text-[10px] font-mono text-[#647380]">→</kbd>
                <span>Navigate pages</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-[#0b1622] rounded text-[10px] font-mono text-[#647380]">F</kbd>
                <span>Toggle fullscreen</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-[#0b1622] rounded text-[10px] font-mono text-[#647380]">Esc</kbd>
                <span>Exit reader</span>
              </div>
              <p className="pt-2 text-[#647380]">
                Click left/right sides of the page to navigate. Supports page &amp; long strip modes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

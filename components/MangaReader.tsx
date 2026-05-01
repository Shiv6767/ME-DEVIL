'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Rows3,
  Columns3,
  Settings2,
  ImageIcon,
  X,
} from 'lucide-react';

interface MangaReaderProps {
  pages: string[];
  chapterTitle: string;
  chapterNumber: string | null;
  onClose: () => void;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
  hasNextChapter?: boolean;
  hasPrevChapter?: boolean;
}

type ReadingMode = 'page' | 'longstrip';

export function MangaReader({
  pages,
  chapterTitle,
  chapterNumber,
  onClose,
  onNextChapter,
  onPrevChapter,
  hasNextChapter,
  hasPrevChapter,
}: MangaReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [readingMode, setReadingMode] = useState<ReadingMode>('page');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [imageQuality, setImageQuality] = useState<'normal' | 'high'>('normal');
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = pages.length;

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (readingMode === 'page') setShowControls(false);
    }, 3000);
  }, [readingMode]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetControlsTimer();
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [resetControlsTimer]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readingMode !== 'page') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'd':
          e.preventDefault();
          goToNextPage();
          break;
        case 'ArrowLeft':
        case 'a':
          e.preventDefault();
          goToPrevPage();
          break;
        case 'Escape':
          e.preventDefault();
          if (isFullscreen) toggleFullscreen();
          else onClose();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  function goToNextPage() {
    if (currentPage < totalPages - 1) {
      setCurrentPage((p) => p + 1);
      resetControlsTimer();
    } else if (hasNextChapter && onNextChapter) {
      onNextChapter();
    }
  }

  function goToPrevPage() {
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
      resetControlsTimer();
    } else if (hasPrevChapter && onPrevChapter) {
      onPrevChapter();
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  // Reset page when mode changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(0);
  }, [readingMode]);

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  if (pages.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0b1622] flex items-center justify-center">
        <div className="text-center space-y-4">
          <ImageIcon className="h-16 w-16 text-[#3a4a5a] mx-auto" />
          <h3 className="text-lg font-bold text-[#9fadbd]">No Pages Available</h3>
          <p className="text-sm text-[#8ba0b2]">This chapter has no readable pages from the selected source.</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#3db4f2] text-white rounded font-bold text-sm hover:bg-[#3db4f2]/80 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col"
      onMouseMove={resetControlsTimer}
      onClick={(e) => {
        if (readingMode !== 'page') return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        if (x < width * 0.3) goToPrevPage();
        else if (x > width * 0.7) goToNextPage();
        else resetControlsTimer();
      }}
    >
      {/* Top Controls Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 via-black/60 to-transparent px-4 py-3"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-none">
                    {chapterNumber ? `Ch. ${chapterNumber}` : ''}{' '}
                    {chapterTitle && chapterTitle !== `Chapter ${chapterNumber}` ? `— ${chapterTitle}` : ''}
                  </h3>
                  {readingMode === 'page' && (
                    <p className="text-xs text-white/60">
                      Page {currentPage + 1} / {totalPages}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Reading Mode Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setReadingMode(readingMode === 'page' ? 'longstrip' : 'page');
                  }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title={readingMode === 'page' ? 'Switch to Long Strip' : 'Switch to Page Mode'}
                >
                  {readingMode === 'page' ? (
                    <Rows3 className="h-4 w-4 text-white" />
                  ) : (
                    <Columns3 className="h-4 w-4 text-white" />
                  )}
                </button>

                {/* Settings */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSettings(!showSettings);
                  }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Settings2 className="h-4 w-4 text-white" />
                </button>

                {/* Fullscreen */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                  }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4 text-white" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Settings Dropdown */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-4 top-14 bg-[#151f2e] border border-[#1a2a3a] rounded-lg p-4 space-y-3 shadow-2xl z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#8ba0b2] uppercase tracking-wider">Image Quality</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setImageQuality('normal')}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${imageQuality === 'normal' ? 'bg-[#3db4f2] text-white' : 'bg-[#0b1622] text-[#8ba0b2] hover:text-white'
                          }`}
                      >
                        Normal
                      </button>
                      <button
                        onClick={() => setImageQuality('high')}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${imageQuality === 'high' ? 'bg-[#3db4f2] text-white' : 'bg-[#0b1622] text-[#8ba0b2] hover:text-white'
                          }`}
                      >
                        High
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#8ba0b2] uppercase tracking-wider">Reading Mode</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReadingMode('page')}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${readingMode === 'page' ? 'bg-[#3db4f2] text-white' : 'bg-[#0b1622] text-[#8ba0b2] hover:text-white'
                          }`}
                      >
                        Page
                      </button>
                      <button
                        onClick={() => setReadingMode('longstrip')}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${readingMode === 'longstrip' ? 'bg-[#3db4f2] text-white' : 'bg-[#0b1622] text-[#8ba0b2] hover:text-white'
                          }`}
                      >
                        Long Strip
                      </button>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#1a2a3a]">
                    <p className="text-[10px] text-[#647380]">
                      Keyboard: ← → or A/D to navigate, F for fullscreen, Esc to close
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Reading Area */}
      {readingMode === 'page' ? (
        /* ────── PAGE MODE ────── */
        <div className="flex-1 relative flex items-center justify-center select-none">
          {/* Left Arrow Area */}
          <AnimatePresence>
            {showControls && currentPage > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevPage();
                }}
                className="absolute left-2 sm:left-4 z-20 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Page Image */}
          <div className="relative w-full h-full flex items-center justify-center px-12 sm:px-20">
            {imageErrors.has(currentPage) ? (
              <div className="flex flex-col items-center gap-3 text-[#8ba0b2]">
                <ImageIcon className="h-12 w-12 text-[#3a4a5a]" />
                <p className="text-sm">Failed to load page {currentPage + 1}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageErrors((prev) => {
                      const next = new Set(prev);
                      next.delete(currentPage);
                      return next;
                    });
                  }}
                  className="text-xs text-[#3db4f2] hover:text-white transition-colors font-bold"
                >
                  Retry
                </button>
              </div>
            ) : (
              <img
                key={`${currentPage}-${imageQuality}`}
                src={pages[currentPage]}
                alt={`Page ${currentPage + 1}`}
                className="max-h-full max-w-full object-contain"
                onError={() => handleImageError(currentPage)}
                draggable={false}
              />
            )}
          </div>

          {/* Right Arrow Area */}
          <AnimatePresence>
            {showControls && currentPage < totalPages - 1 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextPage();
                }}
                className="absolute right-2 sm:right-4 z-20 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 transition-colors"
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Chapter Navigation at end of chapter */}
          {currentPage === totalPages - 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3" onClick={(e) => e.stopPropagation()}>
              {hasPrevChapter && (
                <button
                  onClick={onPrevChapter}
                  className="px-4 py-2 rounded-lg bg-[#151f2e] text-[#9fadbd] hover:text-white text-xs font-bold transition-colors"
                >
                  ← Previous Chapter
                </button>
              )}
              {hasNextChapter && (
                <button
                  onClick={onNextChapter}
                  className="px-4 py-2 rounded-lg bg-[#3db4f2] text-white text-xs font-bold hover:bg-[#3db4f2]/80 transition-colors"
                >
                  Next Chapter →
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ────── LONG STRIP MODE ────── */
        <div className="flex-1 overflow-y-auto overflow-x-hidden reader-scroll">
          <div className="max-w-3xl mx-auto py-20">
            {pages.map((pageUrl, i) => (
              <div key={i} className="relative w-full">
                {imageErrors.has(i) ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#8ba0b2]">
                    <ImageIcon className="h-10 w-10 text-[#3a4a5a]" />
                    <p className="text-xs">Page {i + 1} failed to load</p>
                    <button
                      onClick={() => {
                        setImageErrors((prev) => {
                          const next = new Set(prev);
                          next.delete(i);
                          return next;
                        });
                      }}
                      className="text-xs text-[#3db4f2] hover:text-white transition-colors font-bold"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <img
                    src={pageUrl}
                    alt={`Page ${i + 1}`}
                    className="w-full h-auto"
                    loading={i < 3 ? 'eager' : 'lazy'}
                    onError={() => handleImageError(i)}
                  />
                )}
              </div>
            ))}

            {/* End of chapter navigation */}
            <div className="flex justify-center gap-3 py-10" onClick={(e) => e.stopPropagation()}>
              {hasPrevChapter && (
                <button
                  onClick={onPrevChapter}
                  className="px-6 py-3 rounded-lg bg-[#151f2e] text-[#9fadbd] hover:text-white text-sm font-bold transition-colors"
                >
                  ← Previous Chapter
                </button>
              )}
              {hasNextChapter && (
                <button
                  onClick={onNextChapter}
                  className="px-6 py-3 rounded-lg bg-[#3db4f2] text-white text-sm font-bold hover:bg-[#3db4f2]/80 transition-colors"
                >
                  Next Chapter →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Page Slider (Page Mode Only) */}
      <AnimatePresence>
        {showControls && readingMode === 'page' && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-6 py-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-3xl mx-auto">
              <input
                type="range"
                min={0}
                max={totalPages - 1}
                value={currentPage}
                onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#3db4f2]
                  [&::-webkit-slider-thumb]:hover:scale-150 [&::-webkit-slider-thumb]:transition-transform"
              />
              <div className="flex justify-between mt-1 text-[10px] text-white/40 font-mono">
                <span>1</span>
                <span>{totalPages}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

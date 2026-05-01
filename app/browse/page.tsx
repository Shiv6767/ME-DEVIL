'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Crown, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import fetcher, { JikanResponse, MangaNode, JIKAN_BASE_URL } from '@/lib/api';
import { MangaCard } from '@/components/MangaCard';

interface CategoryConfig {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  getUrl: (page: number) => string;
  accentColor: string;
}

const CATEGORIES: Record<string, CategoryConfig> = {
  trending: {
    title: 'Trending Now',
    subtitle: 'Currently buzzing across the manga community',
    icon: TrendingUp,
    getUrl: (page: number) =>
      `${JIKAN_BASE_URL}/manga?status=publishing&order_by=members&sort=desc&limit=24&page=${page}`,
    accentColor: '#3db4f2',
  },
  popular: {
    title: 'All Time Popular',
    subtitle: 'The most beloved manga of all time',
    icon: Crown,
    getUrl: (page: number) =>
      `${JIKAN_BASE_URL}/top/manga?limit=24&filter=bypopularity&page=${page}`,
    accentColor: '#fbbf24',
  },
};

function BrowseContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || 'trending';
  const config = CATEGORIES[category] || CATEGORIES.trending;
  const [page, setPage] = useState(1);

  // Reset page when category changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [category]);

  const { data, error, isLoading } = useSWR<JikanResponse<MangaNode[]>>(
    config.getUrl(page),
    fetcher
  );

  const IconComponent = config.icon;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8ba0b2] hover:text-[#d3d5f3] transition-colors uppercase tracking-wider mb-6"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Discover
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${config.accentColor}20` }}
          >
            <IconComponent
              className="h-5 w-5"
              style={{ color: config.accentColor }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#9fadbd] uppercase tracking-wider">
              {config.title}
            </h1>
            <p className="text-sm text-[#8ba0b2]">{config.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-8 border-b border-[#1a2a3a] pb-4">
        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const isActive = key === category;
          const TabIcon = cat.icon;
          return (
            <Link
              key={key}
              href={`/browse?category=${key}`}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                ${isActive
                  ? 'bg-[#1a2a3a] text-white shadow-sm'
                  : 'text-[#8ba0b2] hover:text-[#d3d5f3] hover:bg-[#151f2e]'
                }
              `}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {cat.title}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-8"
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex flex-col animate-pulse">
                <div className="aspect-[3/4] w-full bg-[#151f2e] mb-3 rounded shadow-md" />
                <div className="h-4 w-3/4 bg-[#151f2e] mb-2 rounded" />
                <div className="h-3 w-1/2 bg-[#151f2e] rounded" />
              </div>
            ))}
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#151f2e] p-8 rounded text-center"
          >
            <p className="text-red-400 text-sm font-semibold mb-2">
              Failed to load data
            </p>
            <p className="text-[#8ba0b2] text-xs">{error.message}</p>
          </motion.div>
        )}

        {!isLoading && !error && data?.data && (
          <motion.div
            key={`${category}-${page}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            {/* Result Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-bold text-[#8ba0b2] uppercase tracking-wider">
                Page {page}
                {data.pagination &&
                  ` of ${data.pagination.last_visible_page || '?'}`}
              </p>
              <p className="text-xs text-[#647380]">
                {data.data.length} titles shown
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-8">
              {data.data.map((manga, i) => (
                <MangaCard key={manga.mal_id} manga={manga} index={i} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-3 mt-12 pb-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={`
                  flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                  ${page <= 1
                    ? 'bg-[#151f2e] text-[#3a4a5a] cursor-not-allowed'
                    : 'bg-[#1a2a3a] text-[#9fadbd] hover:text-white hover:bg-[#223344] shadow-sm'
                  }
                `}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex gap-1">
                {Array.from(
                  { length: Math.min(5, data.pagination?.last_visible_page || 5) },
                  (_, i) => {
                    let pageNum: number;
                    const total = data.pagination?.last_visible_page || 5;
                    if (total <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= total - 2) {
                      pageNum = total - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`
                          w-9 h-9 rounded-lg text-xs font-bold transition-all
                          ${pageNum === page
                            ? 'text-white shadow-sm'
                            : 'bg-transparent text-[#8ba0b2] hover:bg-[#1a2a3a] hover:text-white'
                          }
                        `}
                        style={
                          pageNum === page
                            ? { backgroundColor: config.accentColor }
                            : {}
                        }
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={
                  data.pagination
                    ? !data.pagination.has_next_page
                    : data.data.length < 24
                }
                className={`
                  flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                  ${(data.pagination && !data.pagination.has_next_page) ||
                    (!data.pagination && data.data.length < 24)
                    ? 'bg-[#151f2e] text-[#3a4a5a] cursor-not-allowed'
                    : 'bg-[#1a2a3a] text-[#9fadbd] hover:text-white hover:bg-[#223344] shadow-sm'
                  }
                `}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="animate-pulse">
            <div className="h-6 w-40 bg-[#151f2e] mb-4 rounded" />
            <div className="h-4 w-64 bg-[#151f2e] mb-10 rounded" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-8">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="flex flex-col">
                  <div className="aspect-[3/4] w-full bg-[#151f2e] mb-3 rounded shadow-md" />
                  <div className="h-4 w-3/4 bg-[#151f2e] mb-2 rounded" />
                  <div className="h-3 w-1/2 bg-[#151f2e] rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}

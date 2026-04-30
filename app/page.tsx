'use client';

import { Suspense, useMemo } from 'react';
import useSWR from 'swr';
import { motion } from 'motion/react';
import Link from 'next/link';

import fetcher, { JikanResponse, MangaNode, JIKAN_BASE_URL } from '@/lib/api';
import { MangaCard } from '@/components/MangaCard';
import { useLibraryStore } from '@/lib/store';

function TopMangaSection() {
  const { data, error, isLoading } = useSWR<JikanResponse<MangaNode[]>>(
    `${JIKAN_BASE_URL}/top/manga?limit=6&filter=bypopularity`,
    fetcher
  );

  if (isLoading) return <MangaSkeletonGrid count={6} />;
  if (error) return <div className="text-red-400 text-xs font-bold uppercase tracking-widest mt-4">Failed to load top manga: {error.message}</div>;
  if (!data || !data.data) return <div className="text-red-400 text-xs font-bold uppercase tracking-widest mt-4">No data returned</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-8">
      {data.data.map((manga, i) => (
         <MangaCard key={manga.mal_id} manga={manga} index={i} />
      ))}
    </div>
  );
}

function RecommendationsSection() {
  const saved = useLibraryStore((state) => state.saved);
  const preferredGenres = useMemo(() => {
    const savedList = Object.values(saved);
    if (savedList.length === 0) return [];
    
    const genreCounts: Record<number, number> = {};
    savedList.forEach(manga => {
      manga.genres?.forEach(g => {
        genreCounts[g.mal_id] = (genreCounts[g.mal_id] || 0) + 1;
      });
    });
    
    return Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => parseInt(id));
  }, [saved]);

  const hasHistory = preferredGenres.length > 0;
  const genresQuery = hasHistory ? preferredGenres.join(',') : '1,2,10'; // Fallback
  
  const { data, error, isLoading } = useSWR<JikanResponse<MangaNode[]>>(
    `${JIKAN_BASE_URL}/manga?genres=${genresQuery}&order_by=score&sort=desc&limit=6&status=publishing`,
    fetcher
  );

  if (!hasHistory) {
    return (
      <div className="bg-[#151f2e] p-8 rounded text-center shadow-sm">
        <h3 className="text-sm font-semibold text-[#a0b1c5] mb-2">Build Your Reading Profile</h3>
        <p className="text-xs text-[#a0b1c5]/70 max-w-sm mx-auto mb-4">
          Save titles to your library to receive customized data feeds and predictions.
        </p>
        <Link href="/search" className="text-xs font-bold text-[#3db4f2] hover:text-[#d3d5f3] transition-colors uppercase tracking-wider">
          Initialize Database
        </Link>
      </div>
    );
  }

  if (isLoading) return <MangaSkeletonGrid count={6} />;
  if (error) return <div className="text-red-400 text-xs font-bold uppercase tracking-widest mt-4">Failed to load recommendations: {error.message}</div>;
  if (!data || !data.data) return <div className="text-red-400 text-xs font-bold uppercase tracking-widest mt-4">No data returned</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-8">
      {data.data.map((manga, i) => (
         <MangaCard key={manga.mal_id} manga={manga} index={i} />
      ))}
    </div>
  );
}

function MangaSkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col animate-pulse">
           <div className="aspect-[3/4] w-full bg-[#151f2e] mb-3 rounded shadow-md" />
           <div className="h-4 w-3/4 bg-[#151f2e] mb-2 rounded" />
           <div className="h-3 w-1/2 bg-[#151f2e] rounded" />
        </div>
      ))}
    </div>
  )
}

function ExploreGlobalSection() {
  const { data, error, isLoading } = useSWR<JikanResponse<MangaNode[]>>(
    `${JIKAN_BASE_URL}/manga?status=publishing&order_by=members&sort=desc&limit=6`,
    fetcher
  );
  
  if (isLoading) return <MangaSkeletonGrid count={6} />;
  if (error) return <div className="text-red-400 text-xs font-bold uppercase tracking-widest mt-4">Failed to load trend: {error.message}</div>;
  if (!data || !data.data) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-8">
       {data.data.map((manga, i) => (
         <MangaCard key={manga.mal_id} manga={manga} index={i} />
       ))}
    </div>
  )
}

export default function Home() {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      
      {/* Discovery Grid */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <Link href="/search" className="text-lg font-bold text-[#9fadbd] hover:text-[#d3d5f3] transition-colors uppercase tracking-wider">TRENDING NOW</Link>
          <Link href="/search" className="text-[11px] font-bold text-[#8ba0b2] hover:text-[#d3d5f3] transition-colors uppercase tracking-wider">VIEW ALL</Link>
        </div>
        <Suspense fallback={<MangaSkeletonGrid count={6} />}>
          <ExploreGlobalSection />
        </Suspense>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <Link href="/search" className="text-lg font-bold text-[#9fadbd] hover:text-[#d3d5f3] transition-colors uppercase tracking-wider">RECOMMENDED FOR YOU</Link>
          <Link href="/search" className="text-[11px] font-bold text-[#8ba0b2] hover:text-[#d3d5f3] transition-colors uppercase tracking-wider">VIEW ALL</Link>
        </div>
        <Suspense fallback={<MangaSkeletonGrid count={6} />}>
          <RecommendationsSection />
        </Suspense>
      </section>
      
      <section className="space-y-4">
        <div className="flex items-end justify-between">
           <Link href="/search?sort=bypopularity" className="text-lg font-bold text-[#9fadbd] hover:text-[#d3d5f3] transition-colors uppercase tracking-wider">ALL TIME POPULAR</Link>
           <Link href="/search?sort=bypopularity" className="text-[11px] font-bold text-[#8ba0b2] hover:text-[#d3d5f3] transition-colors uppercase tracking-wider">VIEW ALL</Link>
        </div>
        <Suspense fallback={<MangaSkeletonGrid count={6} />}>
          <TopMangaSection />
        </Suspense>
      </section>
    </div>
  );
}

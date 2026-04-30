'use client';

import { useLibraryStore } from '@/lib/store';
import { MangaCard } from '@/components/MangaCard';
import { useMemo, useState } from 'react';
import { LayoutGrid, Library as LibraryIcon } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

type FilterStatus = 'All' | 'Reading' | 'Plan to Read' | 'Completed';

export default function LibraryPage() {
  const { saved } = useLibraryStore();
  const [filter, setFilter] = useState<FilterStatus>('All');

  const savedList = useMemo(() => {
    let list = Object.values(saved);
    if (filter !== 'All') {
      list = list.filter(manga => manga.status === filter);
    }
    return list.sort((a, b) => b.addedAt - a.addedAt);
  }, [saved, filter]);

  const filters: FilterStatus[] = ['All', 'Reading', 'Plan to Read', 'Completed'];

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 mb-8 border-b border-[#151f2e]">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#9fadbd] uppercase tracking-wider">My Library</h1>
          <p className="text-sm text-[#8ba0b2]">Track and manage your reading collection.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded text-xs font-semibold transition-colors ${
                filter === f 
                  ? 'bg-[#3db4f2] text-white' 
                  : 'bg-[#151f2e] text-[#9fadbd] hover:bg-[#3db4f2]/80 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div>
        {savedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
             <div className="bg-[#151f2e] p-6 rounded-full">
                <LayoutGrid className="h-8 w-8 text-[#8ba0b2]" />
             </div>
             <div className="space-y-1">
               <h3 className="text-lg font-semibold text-[#9fadbd]">Your library is empty</h3>
               <p className="text-sm text-[#8ba0b2] max-w-sm mx-auto">
                 {filter === 'All' 
                   ? "You haven't added any manga to your library yet. Start exploring to build your collection." 
                   : `You don't have any manga marked as "${filter}".`}
               </p>
             </div>
             {filter === 'All' && (
               <Link href="/search" className="mt-4 px-6 py-2 rounded bg-[#3db4f2] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
                 Browse Manga
               </Link>
             )}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-8">
            <AnimatePresence mode="popLayout">
              {savedList.map((manga, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={manga.mal_id}
                >
                  <MangaCard manga={manga as any} index={i} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

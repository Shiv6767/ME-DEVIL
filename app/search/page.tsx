'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Search as SearchIcon, AlertCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

import fetcher, { JikanResponse, MangaNode, JIKAN_BASE_URL } from '@/lib/api';
import { MangaCard } from '@/components/MangaCard';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  const { data, error, isLoading } = useSWR<JikanResponse<MangaNode[]>>(
    debouncedQuery.length >= 3 
      ? `${JIKAN_BASE_URL}/manga?q=${encodeURIComponent(debouncedQuery)}&limit=20&order_by=members&sort=desc`
      : null,
    fetcher
  );

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      <div className="max-w-3xl mb-8">
        <h1 className="text-2xl font-bold text-[#9fadbd] uppercase tracking-wider mb-2">Anime & Manga Search</h1>
        <p className="text-sm text-[#8ba0b2]">Querying 284,102 titles across the database.</p>
      </div>

      <div className="relative group max-w-3xl mb-12">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-[#8ba0b2] group-focus-within:text-[#3db4f2] transition-colors" />
        </div>
        <input
          type="text"
          className="block w-full rounded bg-[#151f2e] py-4 pl-12 pr-4 text-[#9fadbd] placeholder:text-[#647380] focus:outline-none focus:ring-1 focus:ring-[#3db4f2] transition-all sm:text-lg shadow-sm"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      <div className="pt-4">
        {isLoading && (
          <div className="text-[#a0b1c5] flex flex-col space-y-4 animate-pulse">
            <div className="h-4 w-48 bg-[#151f2e] mb-6 rounded"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-8">
              {[...Array(12)].map((_, i) => (
                <div key={i}>
                   <div className="aspect-[3/4] w-full bg-[#151f2e] mb-3 rounded" />
                   <div className="h-4 w-3/4 bg-[#151f2e] mb-1 rounded" />
                   <div className="h-3 w-1/2 bg-[#151f2e] rounded" />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-start py-8 text-[#8ba0b2] gap-2">
             <AlertCircle className="h-8 w-8 text-red-400" />
             <p className="text-red-400 font-semibold text-sm">Failed to fetch results.</p>
          </div>
        )}

        {!isLoading && !error && data?.data?.length === 0 && debouncedQuery.length >= 3 && (
          <div className="py-8 text-[#8ba0b2] text-sm">
            No results found for &quot;{debouncedQuery}&quot;.
          </div>
        )}

        {!isLoading && !error && data?.data && data.data.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-[#a0b1c5] mb-6 uppercase tracking-wider border-b border-[#151f2e] pb-2">Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-8">
              {data.data.map((manga, i) => (
                <MangaCard key={manga.mal_id} manga={manga} index={i} />
              ))}
            </div>
          </div>
        )}

        {debouncedQuery.length < 3 && debouncedQuery.length > 0 && (
           <div className="py-8 text-[#8ba0b2] text-sm italic">
            Please enter at least 3 characters.
          </div>
        )}
      </div>

    </div>
  );
}

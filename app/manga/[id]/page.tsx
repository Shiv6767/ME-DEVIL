'use client';

import { use } from 'react';
import useSWR from 'swr';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Check, Plus, ExternalLink, BookOpen } from 'lucide-react';
import { getExternalReadingSources } from '@/lib/mangadex';

import fetcher, { JikanResponse, MangaNode, JIKAN_BASE_URL } from '@/lib/api';
import { useLibraryStore } from '@/lib/store';

export default function MangaDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const malId = parseInt(resolvedParams.id);

  const { data, error, isLoading } = useSWR<JikanResponse<MangaNode>>(
    malId ? `${JIKAN_BASE_URL}/manga/${malId}` : null,
    fetcher
  );

  const library = useLibraryStore();
  const isSaved = library.hasManga(malId);
  const savedItem = library.saved[malId];

  if (error) return <div className="text-center text-red-500 py-24 font-bold">Failed to load system data.</div>;
  if (isLoading) return <div className="text-center text-gray-400 py-24 uppercase tracking-widest text-[10px] font-bold animate-pulse">Initializing data stream...</div>;
  if (!data?.data) return notFound();

  const manga = data.data;

  const handleLibraryAction = () => {
    if (isSaved) {
      library.removeManga(manga.mal_id);
    } else {
      library.addManga({
        mal_id: manga.mal_id,
        title: manga.title,
        images: manga.images as any,
        genres: manga.genres,
        score: manga.score,
        chapters: manga.chapters,
        publishing: manga.publishing,
        status: 'Plan to Read',
      });
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

      <div className="flex items-center gap-2 mb-8 text-xs text-[#8ba0b2] font-semibold uppercase tracking-wider">
        <span className="text-[#a0b1c5]">Database</span> <span className="mx-1">•</span> <span>ID: {manga.mal_id}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">

        {/* Left Column - Poster */}
        <div className="md:col-span-4 lg:col-span-3 space-y-6">
          <div className="aspect-[3/4] w-full max-w-sm mx-auto md:mx-0 relative bg-[#151f2e] rounded shadow-lg overflow-hidden">
            <Image
              src={manga.images.webp.large_image_url}
              alt={manga.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 300px"
              priority
              unoptimized
            />
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href={`/manga/${manga.mal_id}/read`}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded font-bold text-sm bg-[#3db4f2] text-white hover:bg-[#3db4f2]/80 transition-colors shadow-lg shadow-[#3db4f2]/20"
            >
              <BookOpen className="h-4 w-4" />
              Read Now
            </Link>
            <button
              onClick={handleLibraryAction}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded font-bold text-sm transition-colors ${isSaved
                  ? 'bg-[#3db4f2]/20 text-[#3db4f2] hover:bg-[#3db4f2]/30'
                  : 'bg-[#151f2e] text-white hover:bg-[#3db4f2]'
                }`}
            >
              {isSaved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isSaved ? 'In Library' : 'Add to List'}
            </button>
          </div>

          {isSaved && (
            <div className="bg-[#151f2e] p-4 space-y-3 rounded">
              <label className="text-xs font-bold uppercase tracking-wider text-[#8ba0b2]">List Status</label>
              <select
                value={savedItem.status}
                onChange={(e) => library.updateStatus(manga.mal_id, e.target.value as any)}
                className="w-full bg-[#0b1622] rounded px-3 py-2 text-sm text-[#9fadbd] focus:ring-1 focus:ring-[#3db4f2] outline-none font-semibold border-none"
              >
                <option value="Reading">Reading</option>
                <option value="Completed">Completed</option>
                <option value="Plan to Read">Plan to Read</option>
              </select>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="bg-[#151f2e] p-4 rounded space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-[#8ba0b2]">Rank</span>
              <span className="text-sm font-bold text-[#9fadbd]">#{manga.rank || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-[#8ba0b2]">Popularity</span>
              <span className="text-sm font-bold text-[#9fadbd]">#{manga.popularity || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-[#8ba0b2]">Score</span>
              <span className="text-sm font-bold text-[#3db4f2]">{manga.score ? `${manga.score}%` : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="md:col-span-8 lg:col-span-9 space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
              {manga.title}
            </h1>
            {manga.title_english && manga.title_english !== manga.title && (
              <h2 className="text-lg text-[#a0b1c5] font-medium">{manga.title_english}</h2>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-[#8ba0b2] pt-2">
              <span>{manga.authors?.[0]?.name || 'Unknown Author'}</span>
              <span>•</span>
              <span className="text-[#3db4f2]">{manga.status}</span>
              <span>•</span>
              <span>{manga.members?.toLocaleString()} Readers</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              {manga.genres?.map(g => (
                <span key={g.mal_id} className="px-3 py-1 bg-[#151f2e] text-[#9fadbd] text-xs font-semibold rounded-full hover:text-[#3db4f2] transition-colors cursor-pointer">
                  {g.name}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4 max-w-4xl">
            <h3 className="text-sm font-bold text-[#a0b1c5] uppercase tracking-wider mb-2">
              Synopsis
            </h3>
            <div className="text-[#9fadbd] leading-relaxed space-y-4 text-sm">
              {manga.synopsis ? (
                manga.synopsis.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))
              ) : (
                <p className="italic text-[#8ba0b2]">No synopsis available.</p>
              )}
            </div>
          </div>

          {/* Additional Info Table */}
          <div className="space-y-4 max-w-4xl pt-4">
            <h3 className="text-sm font-bold text-[#a0b1c5] uppercase tracking-wider mb-2 border-t border-[#151f2e] pt-6">
              Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div className="flex gap-4">
                <span className="text-[#8ba0b2] font-semibold w-24 flex-shrink-0">Chapters</span>
                <span className="text-[#9fadbd]">{manga.chapters || 'Ongoing'}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-[#8ba0b2] font-semibold w-24 flex-shrink-0">Volumes</span>
                <span className="text-[#9fadbd]">{manga.volumes || 'N/A'}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-[#8ba0b2] font-semibold w-24 flex-shrink-0">Demographics</span>
                <span className="text-[#9fadbd]">{manga.demographics?.map(d => d.name).join(', ') || 'N/A'}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-[#8ba0b2] font-semibold w-24 flex-shrink-0">Themes</span>
                <span className="text-[#9fadbd]">{manga.themes?.map(t => t.name).join(', ') || 'N/A'}</span>
              </div>
            </div>

            <div className="pt-6 flex gap-6">
              <a
                href={manga.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#3db4f2] hover:text-[#d3d5f3] transition-colors"
              >
                MyAnimeList
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={`https://anilist.co/search/manga?search=${encodeURIComponent(manga.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#3db4f2] hover:text-[#d3d5f3] transition-colors"
              >
                AniList
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {/* Read Online Sources */}
            <div className="pt-6 border-t border-[#151f2e] mt-6 space-y-4">
              <h3 className="text-sm font-bold text-[#a0b1c5] uppercase tracking-wider">Read Online</h3>
              <div className="flex flex-wrap gap-2">
                {getExternalReadingSources(manga.title).map((source) => (
                  <a
                    key={source.name}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#151f2e] hover:bg-[#1a2a3a] text-[#9fadbd] hover:text-white text-xs font-semibold transition-all"
                  >
                    <span>{source.icon}</span>
                    {source.name}
                    <ExternalLink className="h-3 w-3 text-[#647380]" />
                  </a>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

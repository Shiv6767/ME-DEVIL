'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import type { MangaNode } from '@/lib/api';

interface MangaCardProps {
  manga: MangaNode;
  index: number;
}

export function MangaCard({ manga, index }: MangaCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group cursor-pointer block relative transition-transform hover:-translate-y-1"
    >
      <Link href={`/manga/${manga.mal_id}`} className="absolute inset-0 z-10" aria-label={`View ${manga.title}`} />
      
      <div className="aspect-[3/4] bg-[#151f2e] mb-3 rounded shadow-md relative overflow-hidden group-hover:shadow-lg transition-shadow">
        <Image
          src={manga.images.webp.large_image_url}
          alt={manga.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className="object-cover"
          referrerPolicy="no-referrer"
          unoptimized 
        />
        
        {manga.status === 'Publishing' && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-[#3db4f2] text-white text-xs font-semibold rounded z-20">
            Releasing
          </div>
        )}
      </div>

      <h4 className="text-sm font-semibold truncate text-[#9fadbd] group-hover:text-[#3db4f2] transition-colors">{manga.title}</h4>
      
      <div className="flex justify-between items-center mt-1">
        <p className="text-xs text-[#a0b1c5] truncate pr-2">
          {manga.authors?.[0]?.name || 'Unknown'}
        </p>
        <span className="text-xs text-[#a0b1c5] flex-shrink-0 flex items-center gap-1">
          {manga.score ? `${manga.score}%` : ''}
        </span>
      </div>
    </motion.div>
  );
}

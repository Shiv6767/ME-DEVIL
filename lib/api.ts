import { fetchAnilist } from './anilist';

export const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

// Types for Jikan API Responses
export interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items: {
    count: number;
    total: number;
    per_page: number;
  };
}

export interface MangaNode {
  mal_id: number;
  url: string;
  images: {
    webp: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    }
  };
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  status: string;
  chapters: number | null;
  volumes: number | null;
  publishing: boolean;
  score: number | null;
  scored?: number | null;
  scored_by?: number | null;
  rank?: number | null;
  popularity: number | null;
  members: number | null;
  favorites?: number | null;
  synopsis: string | null;
  background?: string | null;
  authors: { mal_id?: number; type?: string; name: string; url?: string }[];
  genres: { mal_id: number; type?: string; name: string; url?: string }[];
  themes: { mal_id: number; type?: string; name: string; url?: string }[];
  demographics: { mal_id: number; type?: string; name: string; url?: string }[];
}

export interface JikanResponse<T> {
  data: T;
  pagination?: JikanPagination;
}

const fetcher = async (url: string): Promise<any> => {
  if (url.includes('api.jikan.moe')) {
     return fetchAnilist(url);
  }
  const res = await fetch(url);
  return res.json();
};

export default fetcher;

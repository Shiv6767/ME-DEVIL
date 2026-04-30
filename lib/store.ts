import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedManga {
  mal_id: number;
  title: string;
  images: {
    webp: {
      image_url: string;
      large_image_url: string;
    }
  };
  genres: { mal_id: number; type?: string; name: string; url?: string }[];
  score: number | null;
  chapters: number | null;
  publishing: boolean;
  status: 'Reading' | 'Completed' | 'Plan to Read';
  addedAt: number;
}

interface LibraryState {
  saved: Record<number, SavedManga>;
  addManga: (manga: Omit<SavedManga, 'addedAt'>) => void;
  removeManga: (id: number) => void;
  updateStatus: (id: number, status: SavedManga['status']) => void;
  hasManga: (id: number) => boolean;
  getPreferredGenres: () => number[];
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      saved: {},
      addManga: (manga) => set((state) => ({
        saved: {
          ...state.saved,
          [manga.mal_id]: { ...manga, addedAt: Date.now() }
        }
      })),
      removeManga: (id) => set((state) => {
        const newSaved = { ...state.saved };
        delete newSaved[id];
        return { saved: newSaved };
      }),
      updateStatus: (id, status) => set((state) => ({
        saved: {
          ...state.saved,
          [id]: { ...state.saved[id], status }
        }
      })),
      hasManga: (id) => !!get().saved[id],
      getPreferredGenres: () => {
        const saved = Object.values(get().saved);
        if (saved.length === 0) return [];
        
        // Count genre frequencies
        const genreCounts: Record<number, number> = {};
        saved.forEach(manga => {
          manga.genres?.forEach(g => {
            genreCounts[g.mal_id] = (genreCounts[g.mal_id] || 0) + 1;
          });
        });
        
        // Return top 3 genre IDs
        return Object.entries(genreCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([id]) => parseInt(id));
      }
    }),
    {
      name: 'manganexus-library',
    }
  )
);

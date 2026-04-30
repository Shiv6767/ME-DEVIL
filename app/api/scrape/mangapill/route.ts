import { NextResponse } from 'next/server';
import { searchMangaPill, getMangaPillChapters, getMangaPillPages } from '@/lib/scrapers/mangapill';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    if (action === 'search') {
      const query = searchParams.get('query');
      if (!query) return NextResponse.json({ error: 'Query is required' }, { status: 400 });

      const results = await searchMangaPill(query);
      return NextResponse.json({ results });
    }

    else if (action === 'chapters') {
      const mangaPath = searchParams.get('path');
      if (!mangaPath) return NextResponse.json({ error: 'Manga path is required' }, { status: 400 });

      const chapters = await getMangaPillChapters(mangaPath);
      return NextResponse.json({ chapters });
    }

    else if (action === 'pages') {
      const chapterPath = searchParams.get('path');
      if (!chapterPath) return NextResponse.json({ error: 'Chapter path is required' }, { status: 400 });

      const pages = await getMangaPillPages(chapterPath);
      return NextResponse.json({ pages });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API Scrape Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

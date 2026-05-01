import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const source = searchParams.get('source');

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    const headers = new Headers();
    // Add User-Agent to prevent 403 Forbidden
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Set proper referer based on source to bypass hotlink protection
    if (source === 'mangapill') {
      headers.set('Referer', 'https://mangapill.com/');
    } else if (source === 'mangahere') {
      headers.set('Referer', 'https://www.mangahere.cc/');
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.error(`Proxy failed for ${url} with status ${response.status}`);
      return new NextResponse(`Error fetching image: ${response.statusText}`, { status: response.status });
    }

    // Get the image buffer and content type
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        // Cache images aggressively since they rarely change
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image Proxy Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

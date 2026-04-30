export async function fetchAnilist(url: string) {
  // Parse Jikan URL
  const urlObj = new URL(url);
  const path = urlObj.pathname;
  const params = urlObj.searchParams;
  
  let query = '';
  let variables = {};
  
  if (path.includes('/top/manga')) {
    const limit = parseInt(params.get('limit') || '6');
    const page = parseInt(params.get('page') || '1');
    query = `
      query($limit: Int, $page: Int) {
        Page(page: $page, perPage: $limit) {
          pageInfo { total currentPage lastPage hasNextPage perPage }
          media(type: MANGA, sort: POPULARITY_DESC) { ...MediaFragment }
        }
      }
    `;
    variables = { limit, page };
  } else if (path.includes('/manga') && !params.get('q') && params.get('genres')) {
    // Recommendations
    const limit = parseInt(params.get('limit') || '6');
    query = `
       query($limit: Int) {
          Page(page: 1, perPage: $limit) {
            media(type: MANGA, sort: SCORE_DESC, status: RELEASING) { ...MediaFragment }
          }
       }
    `;
     variables = { limit };
  } else if (path.includes('/manga') && !params.get('q') && path.split('/').length > 3) {
      // id
      const parts = path.split('/');
      const id = parseInt(parts[parts.length - 1]);
       query = `
          query($id: Int) {
             Media(id: $id, type: MANGA) { ...MediaFragment }
          }
       `
      variables = { id };
  } else if (path.includes('/manga') && params.get('q')) {
    // Search
    const search = params.get('q');
    query = `
       query($search: String) {
          Page(page: 1, perPage: 24) {
             media(type: MANGA, search: $search, sort: POPULARITY_DESC) { ...MediaFragment }
          }
       }
    `;
    variables = { search };
  } else {
    // Trending
     const limit = parseInt(params.get('limit') || '6');
     const page = parseInt(params.get('page') || '1');
     query = `
        query($limit: Int, $page: Int) {
           Page(page: $page, perPage: $limit) {
              pageInfo { total currentPage lastPage hasNextPage perPage }
              media(type: MANGA, sort: TRENDING_DESC) { ...MediaFragment }
           }
        }
     `
     variables = { limit, page };
  }
  
  const fragment = `
    fragment MediaFragment on Media {
      id title { romaji english native }
      coverImage { extraLarge large }
      status chapters volumes averageScore popularity description(asHtml: false)
      staff { edges { role node { name { full } } } }
      genres
      source
      siteUrl
    }
  `
  
  const res = await fetch('https://graphql.anilist.co/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: fragment + query, variables })
  });
  const data = await res.json();
  
  const toJikan = (m: any) => {
    return {
      mal_id: m.id,
      url: m.siteUrl || `https://anilist.co/manga/${m.id}`,
      images: { webp: { large_image_url: m.coverImage?.extraLarge || m.coverImage?.large, image_url: m.coverImage?.large, small_image_url: m.coverImage?.large } },
      title: m.title?.english || m.title?.romaji || "Unknown",
      title_english: m.title?.english,
      title_romaji: m.title?.romaji || null,
      title_japanese: m.title?.native,
      status: m.status === 'RELEASING' ? 'Publishing' : m.status,
      chapters: m.chapters,
      volumes: m.volumes,
      publishing: m.status === 'RELEASING',
      score: m.averageScore ? m.averageScore : null,
      popularity: m.popularity,
      members: m.popularity,
      synopsis: m.description,
      authors: m.staff?.edges?.filter((e: any) => e.role?.toLowerCase().includes('story') || e.role?.toLowerCase().includes('art')).map((e: any) => ({ name: e.node?.name?.full })) || [],
      genres: m.genres ? m.genres.map((g: string) => ({ name: g, mal_id: Array.from(g).reduce((s, c) => s + c.charCodeAt(0), 0) })) : [],
      themes: [], demographics: []
    }
  }
  
  if (data.data?.Page) {
    const pageInfo = data.data.Page.pageInfo;
    const result: any = { data: data.data.Page.media.map(toJikan) };
    if (pageInfo) {
      result.pagination = {
        last_visible_page: pageInfo.lastPage || 1,
        has_next_page: pageInfo.hasNextPage || false,
        current_page: pageInfo.currentPage || 1,
        items: {
          count: data.data.Page.media.length,
          total: pageInfo.total || 0,
          per_page: pageInfo.perPage || 24,
        }
      };
    }
    return result;
  } else if (data.data?.Media) {
    return { data: toJikan(data.data.Media) }
  }
  return { data: [] }
}

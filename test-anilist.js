async function test() {
  const query = `
    query {
      Page(page: 1, perPage: 2) {
        media(type: MANGA, sort: POPULARITY_DESC) {
          id
          title { romaji english }
          coverImage { large }
          status
          chapters
          volumes
          averageScore
          popularity
          description(asHtml: false)
          staff { edges { node { name { full } } } }
          genres
        }
      }
    }
  `;
  const res = await fetch('https://graphql.anilist.co/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  console.log(await res.json());
}
test();

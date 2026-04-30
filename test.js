import { fetchAnilist } from './lib/anilist.ts';
async function test() {
   const res = await fetchAnilist('https://api.jikan.moe/v4/top/manga?limit=6&filter=bypopularity');
   console.log(res.data[0]);
}
test();

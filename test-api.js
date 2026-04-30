async function test() {
  const res = await fetch('https://api.jikan.moe/v4/manga/1');
  console.log("STATUS CODE:", res.status);
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2).slice(0, 200));
}
test();

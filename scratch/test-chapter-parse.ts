import * as cheerio from "cheerio";

const html = `
<a href="/chapter/123">
    <span>Chapter 197</span>
    <span>2 weeks ago</span>
</a>
<a href="/chapter/124">
    <div>Chapter 198</div>
    <span>last week</span>
</a>
<a href="/chapter/nav">
    <span>First Chapter</span>
</a>
`;

const $ = cheerio.load(html);

$('a[href*="/chapter/"]').each((_, el) => {
    const a = $(el);
    const titleText = a.find('span, p, div').first().text().trim() || a.text().trim();
    console.log("Original Text:", a.text().trim().replace(/\s+/g, ' '));
    console.log("Extracted Title:", titleText);

    if (titleText.toLowerCase().includes('first chapter')) {
        console.log("SKIPPED");
        return;
    }

    const numMatch = titleText.match(/Chapter\s+([\d.]+)/i);
    const chapterNumber = numMatch ? numMatch[1] : '?';
    console.log("Chapter Number:", chapterNumber);
    console.log("---");
});

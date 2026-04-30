import * as cheerio from "cheerio";
import * as fs from 'fs';

const html = fs.readFileSync('asura_test.html', 'utf-8');
const $ = cheerio.load(html);

const results: any[] = [];

// Asura's new layout uses cards. Let's find them.
// The selector in the original script was very rigid. Let's try a more flexible one.
// We look for any div that contains a link to /comics/ or /series/
$('a[href*="/comics/"], a[href*="/series/"]').each((_, el) => {
    const a = $(el);
    const href = a.attr('href');
    if (!href) return;

    // Avoid duplicate results if we match multiple things in the same card
    const id = href.includes('/series/') ? href.replace('/series/', '') : href.replace('/comics/', '');
    if (results.find(r => r.id === id)) return;

    // Try to find the title. In the new layout it's often in an h3 or a bold span.
    let title = a.find('h3').text().trim() ||
        a.find('span.font-bold').text().trim() ||
        a.find('.text-[13px]').text().trim();

    // If not found in the link itself, check siblings or parent (standard card layout)
    if (!title) {
        const parent = a.parent();
        title = parent.find('h3').text().trim() ||
            parent.find('span.font-bold').text().trim() ||
            parent.find('.text-[13px]').text().trim();
    }

    if (href && title && !title.toLowerCase().includes('chapter')) {
        results.push({ id, title, url: href });
    }
});

console.log("Results count:", results.length);
results.slice(0, 10).forEach(r => console.log(`- ${r.title} (${r.id})`));

if (results.length === 0) {
    console.log("No results found. Checking HTML structure...");
    // Fallback: look for ANY link that might be a series
    $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && (href.includes('/comics/') || href.includes('/series/'))) {
            console.log("Potential match:", href, $(el).text().trim());
        }
    });
}

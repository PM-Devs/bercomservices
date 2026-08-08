const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

/**
 * Fetches Google News' public RSS search feed for a query — no API key required.
 * @param {string} query
 * @returns {Promise<Array<{title, link, source, publishedAt}>>}
 */
async function searchGoogleNews(query) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BerComResearchBot/1.0)' }
    });
    if (!res.ok) {
        throw new Error(`Google News RSS request failed (${res.status}) for query "${query}"`);
    }

    const xml = await res.text();
    const parsed = parser.parse(xml);
    const rawItems = parsed?.rss?.channel?.item;
    if (!rawItems) return [];

    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    return items.map((item) => ({
        title: stripHtml(item.title || ''),
        link: item.link || '',
        source: (item.source && (item.source['#text'] || item.source)) || '',
        publishedAt: item.pubDate ? new Date(item.pubDate) : null
    }));
}

function stripHtml(str) {
    return String(str).replace(/<[^>]*>/g, '').trim();
}

/**
 * Runs several queries and returns a deduped-by-link flat list of articles.
 * @param {string[]} queries
 */
async function searchMany(queries) {
    const seen = new Set();
    const all = [];

    for (const query of queries) {
        try {
            const items = await searchGoogleNews(query);
            for (const item of items) {
                if (item.link && !seen.has(item.link)) {
                    seen.add(item.link);
                    all.push({ ...item, matchedQuery: query });
                }
            }
        } catch (err) {
            console.error(`[newsSearch] query failed: "${query}" —`, err.message);
        }
    }

    return all;
}

module.exports = { searchGoogleNews, searchMany };

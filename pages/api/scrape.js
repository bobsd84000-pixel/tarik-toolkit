export default async function handler(req, res) {
  let { url } = req.body;

  if (!url) return res.status(400).json({ error: "URL requise" });

  // Nettoyer URL
  let cleanUrl = url.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = 'https://' + cleanUrl;
  if (cleanUrl.includes('anthropic') && !cleanUrl.includes('.')) {
    cleanUrl = cleanUrl.replace('anthropic', 'anthropic.com');
  }

  const cleanHtml = (html) => html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);

  // 1. Fetch direct
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 8000);
    const r = await fetch(cleanUrl, {
      signal: c.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' },
      redirect: 'follow'
    });
    clearTimeout(t);

    if (r.ok) {
      const html = await r.text();
      const text = cleanHtml(html);
      if (text.length > 50) {
        return res.status(200).json({ text, url: cleanUrl, source: 'direct' });
      }
    }
    console.log(`Direct: HTTP ${r.status}, fallback proxy`);
  } catch (e) {
    console.log(`Direct échoué: ${e.message}, fallback proxy`);
  }

  // 2. Fallback proxy (timeout plus long)
  try {
    const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(cleanUrl);
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 20000);
    const r = await fetch(proxyUrl, { signal: c.signal });
    clearTimeout(t);

    if (!r.ok) return res.status(502).json({ error: `Site inaccessible (proxy HTTP ${r.status})` });

    const data = await r.json();
    const httpCode = data.status?.http_code;

    if (httpCode === 403 || httpCode === 401) {
      return res.status(403).json({ error: `Ce site bloque le scraping (HTTP ${httpCode}). Essaie un autre site.` });
    }

    if (!data.contents) return res.status(502).json({ error: "Aucun contenu récupéré" });

    const text = cleanHtml(data.contents);
    return res.status(200).json({ text, url: cleanUrl, source: 'proxy' });

  } catch (e) {
    const msg = e.name === 'AbortError' ? 'Timeout: site trop lent (>20s)' : e.message;
    return res.status(500).json({ error: msg });
  }
}

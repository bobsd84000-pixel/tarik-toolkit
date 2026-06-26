export default async function handler(req, res) {
  const { url } = req.body;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await r.text();
    const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 3000);
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

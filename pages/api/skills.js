export default async function handler(req, res) {
  const { q } = req.query;
  try {
    const r = await fetch(`https://mcpmarket.com/search?q=${encodeURIComponent(q)}`, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await r.text();
    res.json({ html });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

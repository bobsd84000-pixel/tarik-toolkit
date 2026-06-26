export default async function handler(req, res) {
  const { url } = req.body;

  // Validation URL
  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "URL invalide" });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const r = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TarikToolkit/1.0)" }
    });

    clearTimeout(timeout);

    if (!r.ok) {
      return res.status(502).json({ error: `Echec chargement: HTTP ${r.status}` });
    }

    const html = await r.text();
    const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 4000);

    console.log(`✅ Chargement reussi: ${url}`);
    res.json({ text, status: r.status });

  } catch (e) {
    const msg = e.name === "AbortError" ? "Timeout (10s depasse)" : e.message;
    console.error(`❌ Echec: ${msg}`);
    res.status(500).json({ error: msg });
  }
}

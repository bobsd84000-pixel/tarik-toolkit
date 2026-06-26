export default async function handler(req, res) {
  const { url } = req.body;

  console.log(`[SCRAPE] Request reçu pour: ${url}`);

  // Validation URL
  if (!url) {
    console.log("[SCRAPE] ❌ URL vide");
    return res.status(400).json({ error: "URL requise" });
  }

  try {
    const urlObj = new URL(url);
    console.log(`[SCRAPE] ✅ URL valide: ${urlObj.hostname}`);
  } catch (e) {
    console.log(`[SCRAPE] ❌ URL invalide: ${e.message}`);
    return res.status(400).json({ error: "Format URL invalide" });
  }

  try {
    console.log(`[SCRAPE] Fetching: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log("[SCRAPE] ⏱️ Timeout 10s");
    }, 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    console.log(`[SCRAPE] Status: ${response.status}`);

    if (!response.ok) {
      console.log(`[SCRAPE] ❌ HTTP ${response.status}`);
      return res.status(502).json({ error: `HTTP ${response.status}: ${response.statusText}` });
    }

    const contentType = response.headers.get("content-type");
    console.log(`[SCRAPE] Content-Type: ${contentType}`);

    if (!contentType || !contentType.includes("text/html")) {
      console.log("[SCRAPE] ❌ Pas du HTML");
      return res.status(400).json({ error: "Le contenu n'est pas du HTML" });
    }

    const html = await response.text();
    console.log(`[SCRAPE] ✅ ${html.length} chars téléchargés`);

    // Nettoyer le HTML
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);

    console.log(`[SCRAPE] ✅ Text: ${text.slice(0, 100)}...`);

    return res.status(200).json({
      success: true,
      text,
      url,
      length: text.length
    });

  } catch (err) {
    let errorMsg = err.message;
    
    if (err.name === "AbortError") {
      errorMsg = "Timeout: site trop lent (>10s)";
      console.log(`[SCRAPE] ⏱️ ${errorMsg}`);
    } else if (err.message.includes("ENOTFOUND")) {
      errorMsg = "Domaine introuvable (DNS)";
      console.log(`[SCRAPE] 🌐 ${errorMsg}`);
    } else if (err.message.includes("ECONNREFUSED")) {
      errorMsg = "Connexion refusée";
      console.log(`[SCRAPE] 🔒 ${errorMsg}`);
    } else {
      console.log(`[SCRAPE] ❌ ${err.name}: ${err.message}`);
    }

    return res.status(500).json({
      error: errorMsg,
      details: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
}

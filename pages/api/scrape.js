export default async function handler(req, res) {
  let { url } = req.body;

  try {
    // Nettoyer l'URL
    let cleanUrl = url.trim();
    
    // Ajouter https si manquant
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    // Corriger domaines malformés (anthropic → anthropic.com)
    if (cleanUrl.includes('anthropic') && !cleanUrl.includes('.com') && !cleanUrl.includes('.')) {
      cleanUrl = cleanUrl.replace('anthropic', 'anthropic.com');
    }

    console.log(`🔍 Tentative: ${cleanUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log("⏱️ Timeout 10s");
    }, 10000);

    const response = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TarikBot/1.0)'
      },
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const msg = `HTTP ${response.status}: ${response.statusText}`;
      console.log(`❌ ${msg}`);
      return res.status(502).json({ error: msg });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/html')) {
      console.log("❌ Pas du HTML");
      return res.status(400).json({ error: 'Le contenu n\'est pas du HTML' });
    }

    const html = await response.text();
    console.log(`✅ ${html.length} chars téléchargés`);

    // Nettoyer le HTML
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);

    console.log(`✅ Success! Text: ${text.slice(0, 100)}...`);

    return res.status(200).json({
      success: true,
      text,
      url: cleanUrl,
      length: text.length
    });

  } catch (error) {
    let errorMsg = error.message;

    if (error.name === 'AbortError') {
      errorMsg = 'Timeout: site trop lent (>10s)';
    } else if (error.message.includes('ENOTFOUND')) {
      errorMsg = 'Domaine introuvable (DNS)';
    } else if (error.message.includes('ECONNREFUSED')) {
      errorMsg = 'Connexion refusée';
    } else if (error.message.includes('ECONNRESET')) {
      errorMsg = 'Connexion réinitialisée';
    }

    console.error(`❌ ${error.name}: ${errorMsg}`);

    return res.status(500).json({
      error: errorMsg,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

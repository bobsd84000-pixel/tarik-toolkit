export default async function handler(req, res) {
  let { url } = req.body;

  try {
    // Nettoyer l'URL
    let cleanUrl = url.trim();
    
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    if (cleanUrl.includes('anthropic') && !cleanUrl.includes('.com') && !cleanUrl.includes('.')) {
      cleanUrl = cleanUrl.replace('anthropic', 'anthropic.com');
    }

    console.log(`🔍 Tentative directe: ${cleanUrl}`);

    // Essayer fetch direct
    let html = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(cleanUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TarikBot/1.0)'
        },
        redirect: 'follow'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('text/html')) {
          html = await response.text();
          console.log(`✅ Fetch direct: ${html.length} chars`);
        }
      }
    } catch (e) {
      console.log(`⚠️ Fetch direct échoué: ${e.message}`);
    }

    // Fallback: utiliser proxy CORS
    if (!html) {
      console.log(`🔄 Utilisation du proxy CORS...`);
      
      const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(cleanUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TarikBot/1.0)'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Proxy HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status?.http_code === 200) {
        html = data.contents;
        console.log(`✅ Proxy CORS: ${html.length} chars`);
      } else {
        throw new Error(`Proxy returned: ${data.status?.http_code || 'unknown'}`);
      }
    }

    if (!html) {
      throw new Error('Impossible de charger le contenu');
    }

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

export default async function handler(req, res) {
  const { text, mode, code } = req.body;

  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return res.status(200).json({ result: "❌ ANTHROPIC_API_KEY manquante dans Vercel" });

  // Diagnostic clé (sans l'exposer)
  const keyInfo = `len=${KEY.length} prefix=${KEY.slice(0,7)} hasSpace=${/\s/.test(KEY)}`;

  let system, userContent, maxTokens;
  if (mode === "security") {
    system = "Tu es un expert securite. Fournis: 1) Vulnerabilites (CRITICAL/HIGH/MEDIUM) 2) Fixes 3) Score (0-100) 4) Priorites";
    userContent = `Audit:\n\n${(code || "").slice(0, 2000)}`;
    maxTokens = 1200;
  } else {
    system = "Tu es un analyste web expert. Analyse le contenu et fournis: titre, intent, keywords cles, points importants.";
    userContent = `Analyse ce contenu:\n\n${(text || "").slice(0, 2000)}`;
    maxTokens = 1000;
  }

  if (!userContent || userContent.trim().length < 10) {
    return res.status(200).json({ result: "❌ Contenu vide à analyser" });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": KEY.trim(),
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: userContent }]
      })
    });

    const raw = await r.text();

    if (!r.ok) {
      // Renvoyer l'erreur EXACTE de Claude au front pour debug
      return res.status(200).json({ result: `❌ Claude ${r.status}\n[clé: ${keyInfo}]\n${raw.slice(0, 400)}` });
    }

    const data = JSON.parse(raw);
    const result = data.content?.[0]?.text || "Aucune reponse";
    return res.status(200).json({ result });

  } catch (e) {
    return res.status(200).json({ result: `❌ Exception: ${e.message}` });
  }
}

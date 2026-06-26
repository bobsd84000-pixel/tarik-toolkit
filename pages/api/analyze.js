export default async function handler(req, res) {
  const { text, mode, code } = req.body;

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY manquante dans Vercel env" });
  }

  let system, userContent, maxTokens;

  if (mode === "security") {
    system = "Tu es un expert securite. Fournis:\n1. Vulnerabilites (CRITICAL/HIGH/MEDIUM)\n2. Fixes\n3. Score (0-100)\n4. Priorites";
    userContent = `Audit:\n\n${(code || "").slice(0, 2000)}`;
    maxTokens = 1200;
  } else {
    system = "Tu es un analyste web expert. Analyse le contenu et fournis: titre, intent, keywords cles, points importants.";
    userContent = `Analyse ce contenu:\n\n${(text || "").slice(0, 2000)}`;
    maxTokens = 1000;
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: userContent }]
      })
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error(`Claude API error ${r.status}: ${errText}`);
      return res.status(502).json({ error: `Claude API ${r.status}` });
    }

    const data = await r.json();
    const result = data.content?.[0]?.text || "Aucune reponse";

    return res.status(200).json({ result });

  } catch (e) {
    console.error(`Erreur: ${e.message}`);
    return res.status(500).json({ error: e.message });
  }
}

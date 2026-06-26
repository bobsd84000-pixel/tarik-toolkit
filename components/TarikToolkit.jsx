import { useState, useRef, useEffect } from "react";

export default function TarikToolkit() {
  const [tab, setTab] = useState("scrape");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  // SCRAPE TAB
  const [scrapeUrl, setScrapeUrl] = useState("");
  const scrapeRef = useRef(null);

  // SECURITY TAB
  const [securityCode, setSecurityCode] = useState("");
  const securityRef = useRef(null);

  // SKILLS TAB
  const [skillsQuery, setSkillsQuery] = useState("");
  const [skillsResults, setSkillsResults] = useState([]);
  const skillsRef = useRef(null);

  useEffect(() => {
    if (tab === "scrape" && scrapeRef.current) scrapeRef.current.scrollTop = scrapeRef.current.scrollHeight;
    if (tab === "security" && securityRef.current) securityRef.current.scrollTop = securityRef.current.scrollHeight;
    if (tab === "skills" && skillsRef.current) skillsRef.current.scrollTop = skillsRef.current.scrollHeight;
  }, [result, skillsResults, tab]);

  // SCRAPE & ANALYSE
  const runScrape = async () => {
    if (!scrapeUrl) return;
    setLoading(true);
    setResult("");

    try {
      // Fetch content
      const res = await fetch(scrapeUrl);
      const html = await res.text();
      const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 3000);

      // Claude analyse
      const analyzeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: "Tu es un analyste web expert. Analyse le contenu et fournis: titre, intent, keywords clés, points importants.",
          messages: [{ role: "user", content: `Analyse ce contenu:\n\n${text}` }]
        })
      });

      const data = await analyzeRes.json();
      const analysisText = data.content?.[0]?.text || "Erreur";

      for (let i = 0; i < analysisText.length; i++) {
        await new Promise(r => setTimeout(r, 3));
        setResult(prev => prev + analysisText[i]);
      }
    } catch (err) {
      setResult(`❌ Erreur: ${err.message}`);
    }

    setLoading(false);
  };

  // SECURITY AUDIT
  const runSecurityAudit = async () => {
    if (!securityCode) return;
    setLoading(true);
    setResult("");

    try {
      const auditRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1200,
          system: `Tu es un expert en sécurité code. Analyse et fournis:
1. Vulnérabilités détectées (CRITICAL, HIGH, MEDIUM)
2. Recommendations fixes
3. Score sécurité (0-100)
4. Priorités d'action`,
          messages: [{ role: "user", content: `Audit sécurité du code:\n\n${securityCode}` }]
        })
      });

      const data = await auditRes.json();
      const auditText = data.content?.[0]?.text || "Erreur";

      for (let i = 0; i < auditText.length; i++) {
        await new Promise(r => setTimeout(r, 3));
        setResult(prev => prev + auditText[i]);
      }
    } catch (err) {
      setResult(`❌ Erreur: ${err.message}`);
    }

    setLoading(false);
  };

  // SKILLS SEARCH (MCPMarket)
  const searchSkills = async () => {
    if (!skillsQuery) return;
    setLoading(true);
    setSkillsResults([]);

    try {
      const searchRes = await fetch(`https://mcpmarket.com/search?q=${encodeURIComponent(skillsQuery)}`);
      const html = await searchRes.text();

      // Parse HTML simple (scrape les skills cards)
      const skillRegex = /<div class="skill-card"[^>]*>[\s\S]*?<h3>([^<]+)<\/h3>[\s\S]*?<p>([^<]+)<\/p>[\s\S]*?<a href="([^"]+)"[^>]*>/g;
      let match;
      const results = [];

      while ((match = skillRegex.exec(html)) && results.length < 10) {
        results.push({
          name: match[1].trim(),
          desc: match[2].trim(),
          url: match[3]
        });
      }

      // Fallback si regex ne marche pas
      if (results.length === 0) {
        results.push({
          name: "MCPMarket Skills",
          desc: "Connecte-toi à https://mcpmarket.com pour voir les 142k skills",
          url: `https://mcpmarket.com/search?q=${encodeURIComponent(skillsQuery)}`
        });
      }

      setSkillsResults(results);
    } catch (err) {
      setSkillsResults([{
        name: "❌ Erreur scrape",
        desc: err.message,
        url: `https://mcpmarket.com/search?q=${encodeURIComponent(skillsQuery)}`
      }]);
    }

    setLoading(false);
  };

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", fontFamily: "IBM Plex Mono, monospace", overflow: "hidden" }}>
      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
        padding: "24px 32px",
        textAlign: "center",
        borderBottom: "1px solid #333"
      }}>
        <div style={{ fontSize: "32px", fontWeight: "bold", letterSpacing: "3px", color: "#00d9ff", marginBottom: "6px" }}>
          TARIK TOOLKIT
        </div>
        <div style={{ fontSize: "11px", color: "#87ceeb", letterSpacing: "1px" }}>
          SCRAPE × SECURITY × SKILLS
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "1px solid #222", background: "#080808" }}>
        {["scrape", "security", "skills"].map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setResult(""); setSkillsResults([]); }}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: tab === t ? "#00d9ff20" : "transparent",
              border: "none",
              color: tab === t ? "#00d9ff" : "#87ceeb",
              borderBottom: tab === t ? "2px solid #00d9ff" : "none",
              cursor: "pointer",
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "1px",
              textTransform: "uppercase"
            }}
          >
            {t === "scrape" ? "◆ SCRAPE" : t === "security" ? "🔒 SECURITY" : "🔍 SKILLS"}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "calc(100vh - 120px)", gap: "1px", background: "#222" }}>
        
        {/* INPUT PANEL */}
        <div style={{ background: "#0a0a0a", padding: "20px", overflow: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "10px", color: "#87ceeb", letterSpacing: "1px", marginBottom: "12px", textTransform: "uppercase" }}>
            {tab === "scrape" ? "URL Input" : tab === "security" ? "Code Input" : "Skills Query"}
          </div>

          {tab === "scrape" && (
            <>
              <input
                type="text"
                placeholder="https://example.com"
                value={scrapeUrl}
                onChange={e => setScrapeUrl(e.target.value)}
                style={{
                  background: "#111",
                  border: "1px solid #333",
                  color: "#fff",
                  padding: "10px 12px",
                  borderRadius: "2px",
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: "12px",
                  marginBottom: "12px"
                }}
              />
              <button
                onClick={runScrape}
                disabled={loading || !scrapeUrl}
                style={{
                  padding: "10px",
                  background: loading ? "#333" : "#00d9ff",
                  color: loading ? "#666" : "#000",
                  border: "none",
                  borderRadius: "2px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: "11px"
                }}
              >
                {loading ? "SCRAPING..." : "◆ SCRAPE & ANALYSE"}
              </button>
            </>
          )}

          {tab === "security" && (
            <>
              <textarea
                placeholder="Colle ton code ici..."
                value={securityCode}
                onChange={e => setSecurityCode(e.target.value)}
                style={{
                  background: "#111",
                  border: "1px solid #333",
                  color: "#fff",
                  padding: "10px 12px",
                  borderRadius: "2px",
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: "11px",
                  flex: 1,
                  marginBottom: "12px",
                  resize: "none"
                }}
              />
              <button
                onClick={runSecurityAudit}
                disabled={loading || !securityCode}
                style={{
                  padding: "10px",
                  background: loading ? "#333" : "#EF4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "2px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: "11px"
                }}
              >
                {loading ? "AUDITING..." : "🔒 SECURITY AUDIT"}
              </button>
            </>
          )}

          {tab === "skills" && (
            <>
              <input
                type="text"
                placeholder="Search MCPMarket (142k skills)"
                value={skillsQuery}
                onChange={e => setSkillsQuery(e.target.value)}
                onKeyPress={e => e.key === "Enter" && searchSkills()}
                style={{
                  background: "#111",
                  border: "1px solid #333",
                  color: "#fff",
                  padding: "10px 12px",
                  borderRadius: "2px",
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: "12px",
                  marginBottom: "12px"
                }}
              />
              <button
                onClick={searchSkills}
                disabled={loading || !skillsQuery}
                style={{
                  padding: "10px",
                  background: loading ? "#333" : "#4F46E5",
                  color: "#fff",
                  border: "none",
                  borderRadius: "2px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: "11px"
                }}
              >
                {loading ? "SEARCHING..." : "🔍 SEARCH SKILLS"}
              </button>
            </>
          )}
        </div>

        {/* OUTPUT PANEL */}
        <div style={{ background: "#0a0a0a", padding: "20px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "10px", color: "#87ceeb", letterSpacing: "1px", marginBottom: "12px", textTransform: "uppercase" }}>
            {tab === "scrape" ? "Analysis" : tab === "security" ? "Audit Report" : "Results"}
          </div>

          {tab === "scrape" && (
            <div
              ref={scrapeRef}
              style={{
                flex: 1,
                overflowY: "auto",
                fontSize: "11px",
                color: "#ffffff",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap"
              }}
            >
              {result || <span style={{ color: "#333" }}>← Click SCRAPE & ANALYSE</span>}
              {loading && <span style={{ color: "#00d9ff" }}>▋</span>}
            </div>
          )}

          {tab === "security" && (
            <div
              ref={securityRef}
              style={{
                flex: 1,
                overflowY: "auto",
                fontSize: "11px",
                color: "#ffffff",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap"
              }}
            >
              {result || <span style={{ color: "#333" }}>← Click SECURITY AUDIT</span>}
              {loading && <span style={{ color: "#EF4444" }}>▋</span>}
            </div>
          )}

          {tab === "skills" && (
            <div
              ref={skillsRef}
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}
            >
              {skillsResults.length === 0 && !loading && (
                <span style={{ color: "#333", fontSize: "11px" }}>← Search skills</span>
              )}
              {skillsResults.map((s, i) => (
                <div
                  key={i}
                  style={{
                    background: "#111",
                    border: "1px solid #222",
                    padding: "10px 12px",
                    borderRadius: "2px"
                  }}
                >
                  <div style={{ color: "#4F46E5", fontWeight: "bold", fontSize: "12px", marginBottom: "4px" }}>
                    {s.name}
                  </div>
                  <div style={{ color: "#87ceeb", fontSize: "11px", marginBottom: "6px" }}>
                    {s.desc}
                  </div>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#00d9ff",
                      fontSize: "10px",
                      textDecoration: "none",
                      borderBottom: "1px dashed #00d9ff"
                    }}
                  >
                    View →
                  </a>
                </div>
              ))}
              {loading && <span style={{ color: "#4F46E5" }}>Searching...</span>}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

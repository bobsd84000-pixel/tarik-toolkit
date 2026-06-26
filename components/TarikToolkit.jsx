'use client'
import { useState, useRef, useEffect } from "react";

export default function TarikToolkit() {
  const [tab, setTab] = useState("scrape");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [scrapeUrl, setScrapeUrl] = useState("https://anthropic.com");
  const [securityCode, setSecurityCode] = useState("");
  const [skillsQuery, setSkillsQuery] = useState("");
  const [skillsResults, setSkillsResults] = useState([]);
  const [debug, setDebug] = useState("");
  const outputRef = useRef(null);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [result, skillsResults, debug]);

  const testConnection = async () => {
    setDebug("🔍 Test server...");
    try {
      const res = await fetch("/api/debug");
      const data = await res.json();
      setDebug(JSON.stringify(data, null, 2));
    } catch (e) {
      setDebug(`❌ ${e.message}`);
    }
  };

  const runScrape = async () => {
    if (!scrapeUrl) return;
    setLoading(true); setResult(""); setDebug("📡 Scraping...");
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl })
      });
      setDebug(`📥 Scrape: HTTP ${res.status}`);
      if (!res.ok) {
        const e = await res.json();
        setResult(`❌ ${e.error}`); setLoading(false); return;
      }
      const { text } = await res.json();
      setDebug(`✅ ${text.length} chars. Analyse...`);

      const aRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode: "scrape" })
      });
      if (!aRes.ok) {
        const e = await aRes.json();
        setResult(`❌ Analyse: ${e.error}`); setLoading(false); return;
      }
      const { result: analysisText } = await aRes.json();
      setDebug("✅ Done");
      for (let i = 0; i < analysisText.length; i++) {
        await new Promise(r => setTimeout(r, 3));
        setResult(prev => prev + analysisText[i]);
      }
    } catch (err) {
      setDebug(`❌ ${err.message}`);
      setResult(`❌ ${err.message}`);
    }
    setLoading(false);
  };

  const runSecurityAudit = async () => {
    if (!securityCode) return;
    setLoading(true); setResult(""); setDebug("🔒 Audit...");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: securityCode, mode: "security" })
      });
      if (!res.ok) {
        const e = await res.json();
        setResult(`❌ ${e.error}`); setLoading(false); return;
      }
      const { result: txt } = await res.json();
      setDebug("✅ Done");
      for (let i = 0; i < txt.length; i++) {
        await new Promise(r => setTimeout(r, 3));
        setResult(prev => prev + txt[i]);
      }
    } catch (err) {
      setDebug(`❌ ${err.message}`);
      setResult(`❌ ${err.message}`);
    }
    setLoading(false);
  };

  const searchSkills = async () => {
    if (!skillsQuery) return;
    setLoading(true); setSkillsResults([]); setDebug("🔍 Search...");
    try {
      const res = await fetch(`/api/skills?q=${encodeURIComponent(skillsQuery)}`);
      const { html, error } = await res.json();
      if (error) throw new Error(error);
      const rx = /<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<p[^>]*>([^<]+)<\/p>/g;
      let m; const results = [];
      while ((m = rx.exec(html)) && results.length < 10) {
        results.push({ name: m[1].trim(), desc: m[2].trim(), url: `https://mcpmarket.com/search?q=${encodeURIComponent(skillsQuery)}` });
      }
      if (results.length === 0) results.push({ name: "MCPMarket", desc: "Voir sur le site", url: `https://mcpmarket.com/search?q=${encodeURIComponent(skillsQuery)}` });
      setSkillsResults(results);
      setDebug(`✅ ${results.length} resultats`);
    } catch (err) {
      setDebug(`❌ ${err.message}`);
      setSkillsResults([]);
    }
    setLoading(false);
  };

  const s = { background: "#000", color: "#fff", minHeight: "100vh", fontFamily: "IBM Plex Mono, monospace", overflow: "hidden" };

  return (
    <div style={s}>
      <div style={{ background: "linear-gradient(135deg,#0a0a0a,#1a1a2e,#16213e)", padding: "24px 32px", textAlign: "center", borderBottom: "1px solid #333" }}>
        <div style={{ fontSize: "32px", fontWeight: "bold", letterSpacing: "3px", color: "#00d9ff", marginBottom: "6px" }}>TARIK TOOLKIT</div>
        <div style={{ fontSize: "11px", color: "#87ceeb", letterSpacing: "1px" }}>SCRAPE × SECURITY × SKILLS</div>
        <button onClick={testConnection} style={{ marginTop: "8px", padding: "6px 12px", background: "#00d9ff20", color: "#00d9ff", border: "1px solid #00d9ff", fontSize: "10px", cursor: "pointer" }}>🔍 TEST SERVER</button>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #222", background: "#080808" }}>
        {["scrape", "security", "skills"].map(t => (
          <button key={t} onClick={() => { setTab(t); setResult(""); setSkillsResults([]); setDebug(""); }} style={{
            flex: 1, padding: "12px 16px", background: tab === t ? "#00d9ff20" : "transparent",
            border: "none", color: tab === t ? "#00d9ff" : "#87ceeb",
            borderBottom: tab === t ? "2px solid #00d9ff" : "none",
            cursor: "pointer", fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase"
          }}>
            {t === "scrape" ? "◆ SCRAPE" : t === "security" ? "🔒 SECURITY" : "🔍 SKILLS"}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "calc(100vh - 120px)", gap: "1px", background: "#222" }}>
        <div style={{ background: "#0a0a0a", padding: "20px", overflow: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "10px", color: "#87ceeb", letterSpacing: "1px", marginBottom: "12px", textTransform: "uppercase" }}>
            {tab === "scrape" ? "URL Input" : tab === "security" ? "Code Input" : "Skills Query"}
          </div>

          {tab === "scrape" && <>
            <input type="text" placeholder="https://example.com" value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)}
              style={{ background: "#111", border: "1px solid #333", color: "#fff", padding: "10px 12px", borderRadius: "2px", fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", marginBottom: "12px" }} />
            <button onClick={runScrape} disabled={loading || !scrapeUrl} style={{ padding: "10px", background: loading ? "#333" : "#00d9ff", color: loading ? "#666" : "#000", border: "none", borderRadius: "2px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold", fontFamily: "IBM Plex Mono, monospace", fontSize: "11px" }}>
              {loading ? "SCRAPING..." : "◆ SCRAPE & ANALYSE"}
            </button>
          </>}

          {tab === "security" && <>
            <textarea placeholder="Colle ton code ici..." value={securityCode} onChange={e => setSecurityCode(e.target.value)}
              style={{ background: "#111", border: "1px solid #333", color: "#fff", padding: "10px 12px", borderRadius: "2px", fontFamily: "IBM Plex Mono, monospace", fontSize: "11px", flex: 1, marginBottom: "12px", resize: "none" }} />
            <button onClick={runSecurityAudit} disabled={loading || !securityCode} style={{ padding: "10px", background: loading ? "#333" : "#EF4444", color: "#fff", border: "none", borderRadius: "2px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold", fontFamily: "IBM Plex Mono, monospace", fontSize: "11px" }}>
              {loading ? "AUDITING..." : "🔒 SECURITY AUDIT"}
            </button>
          </>}

          {tab === "skills" && <>
            <input type="text" placeholder="Search MCPMarket (142k skills)" value={skillsQuery} onChange={e => setSkillsQuery(e.target.value)} onKeyPress={e => e.key === "Enter" && searchSkills()}
              style={{ background: "#111", border: "1px solid #333", color: "#fff", padding: "10px 12px", borderRadius: "2px", fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", marginBottom: "12px" }} />
            <button onClick={searchSkills} disabled={loading || !skillsQuery} style={{ padding: "10px", background: loading ? "#333" : "#4F46E5", color: "#fff", border: "none", borderRadius: "2px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold", fontFamily: "IBM Plex Mono, monospace", fontSize: "11px" }}>
              {loading ? "SEARCHING..." : "🔍 SEARCH SKILLS"}
            </button>
          </>}
        </div>

        <div style={{ background: "#0a0a0a", padding: "20px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "10px", color: "#87ceeb", letterSpacing: "1px", textTransform: "uppercase" }}>
              {tab === "scrape" ? "Analysis" : tab === "security" ? "Audit Report" : "Results"}
            </div>
            {debug && <div style={{ fontSize: "10px", color: "#ffaa00", cursor: "pointer" }} onClick={() => setDebug("")}>Clear Debug</div>}
          </div>

          {debug && <div style={{ background: "#1a1a2e", border: "1px solid #222", padding: "10px", borderRadius: "2px", marginBottom: "10px", fontSize: "10px", color: "#ffaa00", maxHeight: "120px", overflowY: "auto", whiteSpace: "pre-wrap" }}>{debug}</div>}

          {tab !== "skills" && (
            <div ref={outputRef} style={{ flex: 1, overflowY: "auto", fontSize: "11px", color: "#fff", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
              {result || <span style={{ color: "#333" }}>← Click pour lancer</span>}
              {loading && <span style={{ color: tab === "security" ? "#EF4444" : "#00d9ff" }}>▋</span>}
            </div>
          )}

          {tab === "skills" && (
            <div ref={outputRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
              {skillsResults.length === 0 && !loading && <span style={{ color: "#333", fontSize: "11px" }}>← Search skills</span>}
              {skillsResults.map((sk, i) => (
                <div key={i} style={{ background: "#111", border: "1px solid #222", padding: "10px 12px", borderRadius: "2px" }}>
                  <div style={{ color: "#4F46E5", fontWeight: "bold", fontSize: "12px", marginBottom: "4px" }}>{sk.name}</div>
                  <div style={{ color: "#87ceeb", fontSize: "11px", marginBottom: "6px" }}>{sk.desc}</div>
                  <a href={sk.url} target="_blank" rel="noopener noreferrer" style={{ color: "#00d9ff", fontSize: "10px", textDecoration: "none", borderBottom: "1px dashed #00d9ff" }}>View →</a>
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

'use client'
import { useState } from 'react'

export default function TestPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)

  const addLog = (msg) => {
    setLogs(prev => [...prev, msg])
  }

  const testScrape = async () => {
    setLogs([])
    setLoading(true)
    addLog('🛠️ TARIK TOOLKIT TEST v2.0')
    addLog('━'.repeat(40))

    const url = 'https://anthropic'
    
    // Nettoyer URL
    let cleanUrl = url.trim()
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl
    }
    if (cleanUrl.includes('anthropic') && !cleanUrl.includes('.com')) {
      cleanUrl = cleanUrl.replace('anthropic', 'anthropic.com')
    }
    cleanUrl = cleanUrl.replace(/\.com\.com$/, '.com')
    
    addLog(`🔗 URL corrigée: ${cleanUrl}`)
    addLog('⏳ Tentative fetch direct...')

    try {
      const response = await fetch(cleanUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
          'Accept': 'text/html'
        },
        mode: 'cors',
        credentials: 'omit'
      })

      addLog(`📡 Statut: ${response.status} ${response.statusText}`)

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const html = await response.text()
      addLog('✅ CHARGEMENT RÉUSSI !')
      addLog(`📄 Taille: ${html.length} caractères`)

      const title = html.match(/<title>([^<]*)<\/title>/i)
      if (title) addLog(`📌 Titre: ${title[1]}`)

      const links = html.match(/<a [^>]*href=["']([^"']*)["']/gi) || []
      addLog(`🔗 Liens trouvés: ${links.length}`)

    } catch (error) {
      addLog(`❌ ÉCHEC FETCH DIRECT: ${error.message}`)
      addLog('🔄 Tentative avec PROXY CORS...')

      try {
        const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(cleanUrl)
        const proxyRes = await fetch(proxyUrl)
        const proxyData = await proxyRes.json()

        if (proxyData.contents) {
          addLog('✅ PROXY RÉUSSI !')
          addLog(`📄 Taille: ${proxyData.contents.length} caractères`)

          const title = proxyData.contents.match(/<title>([^<]*)<\/title>/i)
          if (title) addLog(`📌 Titre: ${title[1]}`)

          const links = proxyData.contents.match(/<a [^>]*href=["']([^"']*)["']/gi) || []
          addLog(`🔗 Liens trouvés: ${links.length}`)
        } else {
          addLog(`❌ Proxy: aucun contenu`)
        }

      } catch (proxyError) {
        addLog(`❌ PROXY ÉCHOUÉ: ${proxyError.message}`)
      }
    }

    addLog('━'.repeat(40))
    addLog('✅ Test terminé')
    setLoading(false)
  }

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: 'IBM Plex Mono, monospace' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#00d9ff', fontSize: '24px', marginBottom: '10px' }}>🛠️ TARIK TEST</h1>
        <p style={{ color: '#87ceeb', fontSize: '12px' }}>Scrape + Analyse URL</p>
      </div>

      <button
        onClick={testScrape}
        disabled={loading}
        style={{
          width: '100%',
          padding: '16px',
          background: loading ? '#333' : '#00d9ff',
          color: loading ? '#666' : '#000',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '14px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? '⏳ TEST EN COURS...' : '▶ LANCER TEST'}
      </button>

      <div style={{
        background: '#0a0a0a',
        border: '1px solid #222',
        borderRadius: '4px',
        padding: '16px',
        minHeight: '300px',
        maxHeight: '500px',
        overflowY: 'auto',
        fontSize: '12px',
        lineHeight: '1.8',
        color: '#fff'
      }}>
        {logs.length === 0 ? (
          <span style={{ color: '#333' }}>← Click pour lancer le test</span>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              {log}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px', fontSize: '11px', color: '#666' }}>
        Test: fetch direct → fallback proxy CORS
      </div>
    </div>
  )
}

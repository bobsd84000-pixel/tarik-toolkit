export default function handler(req, res) {
  return res.status(200).json({
    status: "✅ TARIK TOOLKIT DEBUG",
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
    endpoints: {
      scrape: "/api/scrape (POST)",
      skills: "/api/skills (GET)",
      debug: "/api/debug"
    },
    test: "✅ Server est actif"
  });
}

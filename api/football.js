// Vercel proxy
const fetch = require('node-fetch');
module.exports = async (req,res) => {
  const key = process.env.FOOTBALL_API_KEY;
  if(!key) return res.status(500).json({error:'FOOTBALL_API_KEY missing'});
  const path = req.query.path || req.query.endpoint || '';
  if(!path) return res.status(400).json({error:'missing path'});
  const url = 'https://api.football-data.org' + path;
  try{
    const r = await fetch(url, { headers:{ 'X-Auth-Token': key }});
    const data = await r.json();
    res.status(r.status).json(data);
  }catch(e){ res.status(502).json({error:e.message}); }
};

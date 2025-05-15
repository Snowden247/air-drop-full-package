require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const wallets = [];

app.post('/api/connect', (req, res) => {
  const { address, provider, verified } = req.body;
  if (!address || !provider) return res.status(400).json({ error: 'Missing wallet fields' });

  const existing = wallets.find(w => w.address === address);
  if (!existing) {
    wallets.push({ address, provider, verified: !!verified, assets: [] });
    console.log("✅ Wallet connected:", address);
  }
  res.json({ success: true });
});

app.post('/api/claim', (req, res) => {
  const { address, asset } = req.body;
  if (!address || !asset) return res.status(400).json({ error: 'Missing fields' });

  const wallet = wallets.find(w => w.address === address);
  if (wallet && !wallet.assets.includes(asset)) {
    wallet.assets.push(asset);
    console.log("✅ Asset claimed:", asset, "by", address);
  }
  res.json({ success: true });
});

app.get('/api/wallets', (req, res) => {
  res.json(wallets);
});

app.post('/api/transfer', (req, res) => {
  const { address, asset } = req.body;
  console.log(`Simulated transfer: ${asset} from ${address}`);
  res.json({ success: true, message: `Simulated transfer of ${asset} from ${address}` });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password123') {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false });
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));

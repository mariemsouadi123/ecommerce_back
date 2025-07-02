const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: true, 
  credentials: true
}));


app.get('/api/products', (req, res) => {
  console.log('Reçu une requête de:', req.get('origin'));
  res.json([{id: 1, name: 'Produit test'}]);
});

app.post('/api/orders', (req, res) => {
  console.log('Order received:', req.body);
  res.json({ 
    success: true,
    receivedAt: new Date(),
    body: req.body
  });
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on:
  - http://localhost:${PORT}
  - http://${getLocalIpAddress()}:${PORT}
  - http://10.0.2.2:${PORT}`);
});

function getLocalIpAddress() {
  const interfaces = require('os').networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}
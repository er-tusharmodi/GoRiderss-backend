// server.js (or src/server.ts)
const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());

// health check (Render के लिए)
app.get('/healthz', (_, res) => res.status(200).json({ok:true}));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('API on :' + PORT));

import express from 'express';
import analyzeHandler from './api/analyze';
import healthHandler from './api/health';
import historyHandler from './api/history';

const app = express();
app.use(express.json());

// Route requests to the serverless function handlers
app.all('/api/analyze', (req, res) => {
  analyzeHandler(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  });
});

app.all('/api/health', (req, res) => {
  healthHandler(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  });
});

app.all('/api/history', (req, res) => {
  historyHandler(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

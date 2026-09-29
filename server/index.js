const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'gym-studio-api' });
});

app.get('/api/workouts', (_req, res) => {
  res.json({ workouts: [] });
});

app.post('/api/workouts', (req, res) => {
  const body = req.body || {};
  res.status(201).json({ ok: true, saved: body });
});

app.listen(port, () => {
  console.log(`Gym Studio API running on port ${port}`);
});

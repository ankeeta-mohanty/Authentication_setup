import { createApp } from './app.js';

const PORT = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET || 'replace-me-in-production';

const { app } = createApp({ jwtSecret });

app.listen(PORT, () => {
  console.log(`Authentication server running on http://localhost:${PORT}`);
});

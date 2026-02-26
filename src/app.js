import express from 'express';
import helmet from 'helmet';
import { createAuthModule } from './auth/module.js';

export function createApp(config = {}) {
  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: '200kb' }));

  const auth = createAuthModule({ jwtSecret: config.jwtSecret });
  app.use('/auth', auth.router);

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  return { app, auth };
}

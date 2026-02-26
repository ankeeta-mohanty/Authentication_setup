import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { createUserStore, sanitizeUser } from './store.js';

function readBearerToken(headerValue = '') {
  if (!headerValue.startsWith('Bearer ')) return null;
  return headerValue.slice(7).trim();
}

function validateRegistrationInput({ email, password, fullName }) {
  if (!email || !email.includes('@')) return 'A valid email is required';
  if (!password || password.length < 8) return 'Password must be at least 8 characters';
  if (!fullName || fullName.trim().length < 2) return 'Full name must be at least 2 characters';
  return null;
}

export function createAuthModule(options = {}) {
  const {
    jwtSecret = 'replace-me-in-production',
    tokenExpiresIn = '1h',
    issuer = 'finance-learning-auth'
  } = options;

  const userStore = createUserStore();
  const revokedTokens = new Set();
  const router = express.Router();

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please try again shortly.' }
  });

  function createToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email
      },
      jwtSecret,
      { expiresIn: tokenExpiresIn, issuer }
    );
  }

  function requireAuth(req, res, next) {
    const token = readBearerToken(req.headers.authorization);
    if (!token || revokedTokens.has(token)) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret, { issuer });
      const user = userStore.getById(decoded.sub);
      if (!user) {
        return res.status(401).json({ error: 'Invalid token user' });
      }

      req.auth = { token, user: sanitizeUser(user) };
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  router.post('/register', authLimiter, async (req, res) => {
    const message = validateRegistrationInput(req.body ?? {});
    if (message) {
      return res.status(400).json({ error: message });
    }

    try {
      const passwordHash = await bcrypt.hash(req.body.password, 12);
      const user = userStore.createUser({
        email: req.body.email,
        fullName: req.body.fullName,
        passwordHash
      });

      const token = createToken(user);
      return res.status(201).json({ token, user: sanitizeUser(user) });
    } catch (error) {
      if (error.message === 'USER_EXISTS') {
        return res.status(409).json({ error: 'User already exists' });
      }

      return res.status(500).json({ error: 'Unable to register user' });
    }
  });

  router.post('/login', authLimiter, async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = userStore.getByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createToken(user);
    return res.status(200).json({ token, user: sanitizeUser(user) });
  });

  router.get('/me', requireAuth, (req, res) => {
    return res.status(200).json({ user: req.auth.user });
  });

  router.patch('/me', requireAuth, (req, res) => {
    const { fullName, bio, avatarUrl } = req.body ?? {};
    const updated = userStore.updateProfile(req.auth.user.id, { fullName, bio, avatarUrl });
    return res.status(200).json({ user: sanitizeUser(updated) });
  });

  router.post('/logout', requireAuth, (req, res) => {
    revokedTokens.add(req.auth.token);
    return res.status(204).send();
  });

  return {
    router,
    requireAuth,
    stores: {
      userStore,
      revokedTokens
    }
  };
}

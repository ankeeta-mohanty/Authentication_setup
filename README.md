# Authentication Setup

Reusable user authentication + profile module built for easy drop-in use in a finance learning website.

## Features

- Secure registration and login with hashed passwords (`bcryptjs`).
- JWT-based auth for stateless session handling.
- In-memory user/profile store (no database required yet).
- Profile endpoints (`/auth/me`) for viewing/updating user info.
- Logout with token revocation in memory.
- Basic auth rate-limiting and security headers (`helmet`, `express-rate-limit`).

## Quick start

```bash
npm install
npm start
```

Server runs at `http://localhost:3000` by default.

## API

### Register

`POST /auth/register`

```json
{
  "email": "student@example.com",
  "password": "securepass123",
  "fullName": "Finance Student"
}
```

### Login

`POST /auth/login`

```json
{
  "email": "student@example.com",
  "password": "securepass123"
}
```

### Get profile

`GET /auth/me`

Header:

`Authorization: Bearer <token>`

### Update profile

`PATCH /auth/me`

```json
{
  "fullName": "Updated Name",
  "bio": "Learning budgeting",
  "avatarUrl": "https://example.com/avatar.png"
}
```

### Logout

`POST /auth/logout`

Revokes current JWT in memory.

## Reuse in another website

You can mount this module into another Express app:

```js
import express from 'express';
import { createAuthModule } from './src/auth/module.js';

const app = express();
app.use(express.json());

const auth = createAuthModule({
  jwtSecret: process.env.JWT_SECRET
});

app.use('/auth', auth.router);

app.listen(8080);
```

## Notes for production

- Replace the in-memory store with a database-backed implementation.
- Use a strong `JWT_SECRET` from environment variables.
- Consider refresh tokens and email verification.

## Tests

```bash
npm test
```

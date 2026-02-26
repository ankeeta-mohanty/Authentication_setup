import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

test('register, login, profile update and logout flow', async () => {
  const { app } = createApp({ jwtSecret: 'test-secret' });

  const registerResponse = await request(app).post('/auth/register').send({
    email: 'student@example.com',
    password: 'securepass123',
    fullName: 'Finance Student'
  });

  assert.equal(registerResponse.statusCode, 201);
  assert.ok(registerResponse.body.token);
  assert.equal(registerResponse.body.user.email, 'student@example.com');

  const loginResponse = await request(app).post('/auth/login').send({
    email: 'student@example.com',
    password: 'securepass123'
  });

  assert.equal(loginResponse.statusCode, 200);
  const token = loginResponse.body.token;

  const meResponse = await request(app)
    .get('/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(meResponse.statusCode, 200);
  assert.equal(meResponse.body.user.fullName, 'Finance Student');

  const updateResponse = await request(app)
    .patch('/auth/me')
    .set('Authorization', `Bearer ${token}`)
    .send({
      bio: 'Learning personal finance basics'
    });

  assert.equal(updateResponse.statusCode, 200);
  assert.equal(updateResponse.body.user.bio, 'Learning personal finance basics');

  const logoutResponse = await request(app)
    .post('/auth/logout')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(logoutResponse.statusCode, 204);

  const afterLogoutResponse = await request(app)
    .get('/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(afterLogoutResponse.statusCode, 401);
});

test('cannot register duplicate email', async () => {
  const { app } = createApp({ jwtSecret: 'test-secret' });

  const payload = {
    email: 'duplicate@example.com',
    password: 'securepass123',
    fullName: 'Dup User'
  };

  const first = await request(app).post('/auth/register').send(payload);
  const second = await request(app).post('/auth/register').send(payload);

  assert.equal(first.statusCode, 201);
  assert.equal(second.statusCode, 409);
});

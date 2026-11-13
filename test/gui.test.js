'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { createServer } = require('../src/gui');

const AI_PT = fs.readFileSync(path.join(__dirname, '..', 'exemplos', 'ia-pt.txt'), 'utf8');

let server;
let base;

before(async () => {
  server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

test('serve a interface com o formulário', async () => {
  const response = await fetch(`${base}/`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(html, /id="input"/);
  assert.match(html, /id="btn-rewrite"/);
  assert.match(html, /id="offline-banner"/);
});

test('responde ao health check', async () => {
  const response = await fetch(`${base}/api/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});

test('analisa texto pela api', async () => {
  const response = await fetch(`${base}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: AI_PT }),
  });
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.lang, 'pt');
  assert.ok(data.score >= 50);
  assert.ok(Array.isArray(data.signals));
});

test('reescreve e reduz a pontuação pela api', async () => {
  const response = await fetch(`${base}/api/rewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: AI_PT }),
  });
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.ok(data.after.score < data.before.score);
  assert.ok(data.text.trim().length > 0);
  assert.ok(data.edits.length > 0);
});

test('rejeita json inválido', async () => {
  const response = await fetch(`${base}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  });

  assert.equal(response.status, 400);
});

test('rejeita idioma desconhecido', async () => {
  const response = await fetch(`${base}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'texto', lang: 'fr' }),
  });

  assert.equal(response.status, 400);
});

test('rejeita método diferente de POST', async () => {
  const response = await fetch(`${base}/api/analyze`);

  assert.equal(response.status, 405);
});

test('responde 404 em rota desconhecida', async () => {
  const response = await fetch(`${base}/nao-existe`);

  assert.equal(response.status, 404);
});

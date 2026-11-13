'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { analyze } = require('./detect');
const { rewrite } = require('./rewrite');

const MAX_BODY_BYTES = 1024 * 1024;
const MAX_TEXT_CHARS = 200000;
const DEFAULT_PORT = 4319;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function loadHtml() {
  try {
    const sea = require('node:sea');
    if (sea.isSea()) return sea.getAsset('gui.html', 'utf8');
  } catch (error) {
    // Running from source: fall back to the file beside this module.
  }
  return fs.readFileSync(path.join(__dirname, 'gui.html'), 'utf8');
}

function send(res, status, body, headers = {}) {
  const payload = Buffer.from(body, 'utf8');
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': payload.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    ...headers,
  });
  res.end(payload);
}

function sendJson(res, status, data, headers = {}) {
  send(res, status, JSON.stringify(data), {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  });
}

function sendHtml(res) {
  send(res, 200, loadHtml(), {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  });
}

async function readJson(req) {
  const type = String(req.headers['content-type'] || '');
  if (!type.includes('application/json')) {
    throw new HttpError(415, 'Envie o corpo como application/json.');
  }

  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new HttpError(413, 'Texto muito grande. O limite é 1 MB.');
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    throw new HttpError(400, 'JSON inválido.');
  }
}

function parseText(body) {
  if (!body || typeof body.text !== 'string' || !body.text.trim()) {
    throw new HttpError(400, 'Texto vazio.');
  }
  if (body.text.length > MAX_TEXT_CHARS) {
    throw new HttpError(413, 'Texto muito grande. O limite é 200 mil caracteres.');
  }
  return body.text;
}

function parseLang(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === 'pt' || value === 'en') return value;
  throw new HttpError(400, 'Idioma inválido. Use pt ou en.');
}

async function handle(req, res) {
  const pathname = new URL(req.url, 'http://127.0.0.1').pathname;

  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    sendHtml(res);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === '/api/analyze') {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Use POST.' }, { Allow: 'POST' });
      return;
    }
    const body = await readJson(req);
    const analysis = analyze(parseText(body), { lang: parseLang(body.lang) });
    sendJson(res, 200, analysis);
    return;
  }

  if (pathname === '/api/rewrite') {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Use POST.' }, { Allow: 'POST' });
      return;
    }
    const body = await readJson(req);
    const text = parseText(body);
    const before = analyze(text, { lang: parseLang(body.lang) });
    const result = rewrite(text, { lang: before.lang });
    const after = analyze(result.text, { lang: before.lang });
    sendJson(res, 200, {
      before,
      after,
      edits: result.edits,
      swaps: result.swaps,
      text: result.text,
    });
    return;
  }

  sendJson(res, 404, { error: 'Não encontrado.' });
}

function createServer() {
  return http.createServer((req, res) => {
    handle(req, res).catch((error) => {
      if (res.headersSent) {
        res.end();
        return;
      }
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof HttpError ? error.message : 'Erro interno.';
      sendJson(res, status, { error: message });
    });
  });
}

function openBrowser(url) {
  try {
    if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch (error) {
    // The URL is printed by the caller when the browser cannot be opened.
  }
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.removeListener('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.removeListener('error', onError);
      resolve(server.address().port);
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, '127.0.0.1');
  });
}

async function startGui(options = {}) {
  const server = createServer();
  let port;

  try {
    port = await listen(server, options.port || DEFAULT_PORT);
  } catch (error) {
    if (error.code !== 'EADDRINUSE') throw error;
    port = await listen(server, 0);
  }

  const url = `http://127.0.0.1:${port}`;
  if (options.open !== false) openBrowser(url);
  return { server, url };
}

module.exports = { createServer, startGui, openBrowser };

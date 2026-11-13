'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { analyze } = require('../src/detect');
const { detectLanguage } = require('../src/lang');

function example(name) {
  return fs.readFileSync(path.join(__dirname, '..', 'exemplos', name), 'utf8');
}

test('detecta o idioma', () => {
  assert.strictEqual(detectLanguage(example('ia-pt.txt')), 'pt');
  assert.strictEqual(detectLanguage(example('ia-en.txt')), 'en');
});

test('texto com marcas de IA pontua alto', () => {
  const result = analyze(example('ia-pt.txt'));
  assert.strictEqual(result.lang, 'pt');
  assert.ok(result.score >= 50, `pontuação inesperadamente baixa: ${result.score}`);
  assert.ok(result.signals.some((signal) => signal.id === 'lexicon'));
  assert.ok(result.signals.some((signal) => signal.id === 'fillers'));
});

test('texto humano pontua baixo', () => {
  const result = analyze(example('humano-pt.txt'));
  assert.ok(result.score <= 25, `pontuação inesperadamente alta: ${result.score}`);
});

test('separa texto de IA de texto humano em inglês', () => {
  const ai = analyze(example('ia-en.txt'));
  const human = analyze(example('humano-en.txt'));
  assert.strictEqual(ai.lang, 'en');
  assert.ok(ai.score >= human.score + 25, `ia=${ai.score} humano=${human.score}`);
});

test('texto vazio não quebra', () => {
  const result = analyze('   ');
  assert.strictEqual(result.score, 0);
  assert.deepStrictEqual(result.signals, []);
});

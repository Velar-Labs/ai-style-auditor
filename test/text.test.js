'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  splitSentences, countWords, capitalizeSentences,
} = require('../src/text');

test('quebra frases sem confundir abreviações', () => {
  const sentences = splitSentences('O Dr. Silva chegou às 9. Ele saiu depois.');
  assert.strictEqual(sentences.length, 2);
  assert.match(sentences[0], /Dr\. Silva/);
});

test('não quebra decimais', () => {
  const sentences = splitSentences('Custou R$ 3.50 hoje. Amanhã sobe.');
  assert.strictEqual(sentences.length, 2);
});

test('conta palavras com acentos e hífen', () => {
  assert.strictEqual(countWords('Ação, coração e guarda-chuva.'), 4);
});

test('capitaliza o início de cada frase', () => {
  assert.strictEqual(capitalizeSentences('olá. tudo bem?'), 'Olá. Tudo bem?');
});

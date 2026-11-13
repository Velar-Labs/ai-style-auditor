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

test('pega marcas de IA sem jargão: contraste, tríades e negações', () => {
  const text = 'A inteligência artificial já não é futuro, é presente. Ela escreve, desenha, traduz, programa e conversa como se entendesse tudo. Mas por trás de cada resposta existe matemática, dados e milhões de exemplos aprendidos por máquinas. A IA não sonha, não sente saudade e não entende o mundo como nós. Ela prevê palavras, calcula probabilidades e imita padrões. Por isso, pode ajudar muito, mas também pode errar com confiança. O segredo não é temer a tecnologia, nem idolatrá-la. É usá-la com curiosidade, senso crítico e humanidade, lembrando que a criatividade ainda nasce de pessoas que perguntam, erram, imaginam e insistem.';
  const result = analyze(text);
  assert.strictEqual(result.lang, 'pt');
  assert.ok(result.score >= 50, `pontuação inesperadamente baixa: ${result.score}`);
  const ids = result.signals.map((signal) => signal.id);
  assert.ok(ids.includes('contrast-formula'));
  assert.ok(ids.includes('list-triads'));
  assert.ok(ids.includes('negation-strings'));
  assert.ok(ids.includes('aphorisms'));
});

test('pega contraste e tríade em inglês', () => {
  const result = analyze('This change is not just technical, it is cultural. Teams plan, build, test and ship faster. The secret is not working more, it is working better.');
  assert.strictEqual(result.lang, 'en');
  const ids = result.signals.map((signal) => signal.id);
  assert.ok(ids.includes('contrast-formula'));
  assert.ok(ids.includes('list-triads'));
});

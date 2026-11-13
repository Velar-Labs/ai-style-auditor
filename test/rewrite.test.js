'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { rewrite } = require('../src/rewrite');
const { analyze } = require('../src/detect');

function example(name) {
  return fs.readFileSync(path.join(__dirname, '..', 'exemplos', name), 'utf8');
}

test('remove frases de preenchimento e troca jargão', () => {
  const result = rewrite('É importante notar que o processo é crucial para a equipe.');
  assert.doesNotMatch(result.text, /importante notar/i);
  assert.doesNotMatch(result.text, /crucial/i);
  assert.match(result.text, /equipe/i);
});

test('converte travessões em vírgulas', () => {
  const result = rewrite('O time cresceu — e muito — em 2024.');
  assert.doesNotMatch(result.text, /[—–]/);
  assert.match(result.text, /cresceu, e muito, em 2024/);
});

test('divide frases longas em conjunções', () => {
  const input = 'Precisamos revisar o contrato inteiro antes da reunião de amanhã, e também conferir cada anexo enviado pelo fornecedor, mas o prazo está curto, a equipe está pequena e o cliente cobra resposta nesta semana.';
  const result = rewrite(input);
  assert.match(result.text, /\.\s(E|Mas)\s/);
  assert.ok(result.edits.some((edit) => edit.id === 'long'));
});

test('adiciona contrações e remove fórmula em inglês', () => {
  const result = rewrite('It is important to note that we do not have a plan.');
  assert.doesNotMatch(result.text, /important to note/i);
  assert.match(result.text, /don't/i);
  assert.doesNotMatch(result.text, /do not/i);
});

test('reformula "não é apenas X, é Y"', () => {
  const result = rewrite('A mudança não é apenas técnica, é cultural.');
  assert.match(result.text, /é técnica e também cultural/);
});

test('mantém concordância ao trocar adjetivos', () => {
  const result = rewrite('As soluções são abrangentes e robustas.');
  assert.match(result.text, /gerais e confiáveis/);
});

test('remove conectivo aditivo repetido', () => {
  const result = rewrite('Além disso, o time cresceu. Além disso, o cliente voltou.');
  assert.strictEqual((result.text.match(/além disso/gi) || []).length, 1);
  assert.match(result.text, /O cliente voltou/);
});

test('reformula fórmula em inglês com sujeito explícito', () => {
  const result = rewrite('This change is not just technical, it is cultural.');
  assert.match(result.text, /is technical and also cultural/);
});

test('preserva títulos markdown e marcadores de lista', () => {
  const input = '# Título\n\n- É importante notar que o sistema é crucial.';
  const result = rewrite(input);
  assert.match(result.text, /^# Título/m);
  assert.match(result.text, /^- O sistema é importante\./m);
});

test('reduz a pontuação de IA do exemplo', () => {
  const original = example('ia-pt.txt');
  const result = rewrite(original);
  const before = analyze(original);
  const after = analyze(result.text);
  assert.strictEqual(result.lang, 'pt');
  assert.ok(after.score < before.score, `antes=${before.score} depois=${after.score}`);
  assert.ok(before.score - after.score >= 20, `queda pequena: ${before.score} -> ${after.score}`);
});

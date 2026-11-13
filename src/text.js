'use strict';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ABBREVIATIONS = [
  'Sr', 'Sra', 'Srs', 'Dr', 'Dra', 'Drs', 'Prof', 'Profa', 'etc', 'ex',
  'fig', 'vs', 'aprox', 'obs', 'ltda', 'p', 'pp', 'vol', 'ed', 'U.S',
  'U.K', 'E.U.A',
];

const ABBREVIATION_RE = new RegExp(
  `\\b(?:${ABBREVIATIONS.map(escapeRegex).join('|')})\\.`,
  'gi',
);

function protect(text) {
  const store = [];
  const keep = (match) => {
    store.push(match);
    return `\u0000${store.length - 1}\u0000`;
  };
  const out = text
    .replace(/https?:\/\/[^\s"')\]]+/g, keep)
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, keep)
    .replace(ABBREVIATION_RE, keep)
    .replace(/\b\d+\.\d+\b/g, keep);
  return { out, store };
}

function restore(text, store) {
  return text.replace(/\u0000(\d+)\u0000/g, (_, index) => store[Number(index)]);
}

function splitSentences(text) {
  if (!text) return [];
  const { out, store } = protect(text);
  const parts = out.split(/(?<=[.!?…])\s+/u);
  return parts
    .map((part) => restore(part, store))
    .filter((part) => part.trim().length > 0);
}

function countWords(text) {
  const matches = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu);
  return matches ? matches.length : 0;
}

function capitalizeFirst(text) {
  return text.replace(/^(\s*)(\p{L})/u, (_, space, letter) => space + letter.toUpperCase());
}

function capitalizeSentences(text) {
  const parts = splitSentences(text).map((part) => capitalizeFirst(part.trim()));
  return parts.join(' ');
}

function paragraphBlocks(text) {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

module.exports = {
  escapeRegex,
  splitSentences,
  countWords,
  capitalizeFirst,
  capitalizeSentences,
  paragraphBlocks,
};

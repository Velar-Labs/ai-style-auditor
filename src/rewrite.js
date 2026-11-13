'use strict';

const {
  escapeRegex, splitSentences, countWords, capitalizeFirst, capitalizeSentences,
} = require('./text');
const { detectLanguage } = require('./lang');
const {
  FILLERS, CONNECTIVES, ALWAYS_REPLACE, REWRITE, CONTRACTIONS,
} = require('./patterns');

function matchCase(original, replacement) {
  if (!replacement) return '';
  if (original.length > 1 && original === original.toUpperCase()) {
    return replacement.toUpperCase();
  }
  const first = original[0];
  if (first === first.toUpperCase() && first !== first.toLowerCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function swap(text, from, to) {
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])${escapeRegex(from)}(?![\\p{L}\\p{N}])`,
    'giu',
  );
  let count = 0;
  const result = text.replace(pattern, (match) => {
    count += 1;
    return matchCase(match, to);
  });
  return { text: result, count };
}

function dropFiller(sentence, lang, bump) {
  for (const filler of FILLERS[lang]) {
    const pattern = new RegExp(`^${escapeRegex(filler)}\\b\\s*,?\\s*`, 'i');
    const match = sentence.match(pattern);
    if (match) {
      bump('fillers', 'frases de preenchimento removidas');
      return sentence.slice(match[0].length);
    }
  }
  return sentence;
}

function varyConnective(sentence, lang, state, bump) {
  const pairs = CONNECTIVES[lang];
  const always = ALWAYS_REPLACE[lang];
  for (const [from, to] of pairs) {
    const pattern = new RegExp(`^${escapeRegex(from)}\\b\\s*,?\\s*`, 'i');
    const match = sentence.match(pattern);
    if (!match) continue;

    const seen = state.connectiveSeen.get(from) || 0;
    state.connectiveSeen.set(from, seen + 1);
    const rest = sentence.slice(match[0].length);

    if (seen === 0 && !always.has(from)) return sentence;

    let replacement = to;
    if (seen > 0 && (replacement === 'Também' || replacement === 'Also,')) {
      replacement = '';
    } else if (state.usedReplacements.has(replacement)) {
      replacement = '';
    }
    if (replacement) state.usedReplacements.add(replacement);

    bump('connectives', 'conectivos simplificados');
    if (!replacement) return capitalizeFirst(rest);
    return capitalizeFirst(`${replacement} ${rest}`.trim());
  }
  return sentence;
}

function replacePattern(text, pattern, build, bump) {
  let changed = false;
  const result = text.replace(pattern, (...args) => {
    changed = true;
    return build(...args);
  });
  if (changed) bump('formulas', 'fórmulas "não é apenas X, é Y" reformuladas');
  return result;
}

function fixNotJust(sentence, lang, bump) {
  let result = sentence;

  if (lang === 'pt') {
    result = replacePattern(
      result,
      /não (é|são) (?:apenas|somente|só)\s+([^,.;!?]+?),\s*(?:é|são)\s+([^.;!?]+)/gi,
      (_, verb, a, b, offset) => {
        const base = `${verb} ${a.trim()} e também ${b.trim()}`;
        return offset === 0 ? capitalizeFirst(base) : base;
      },
      bump,
    );
    result = replacePattern(
      result,
      /não (?:apenas|somente)\s+([^,.;!?]+?),\s*mas também\s+([^.;!?]+)/gi,
      (_, a, b, offset) => {
        const base = `${a.trim()} e ${b.trim()}`;
        return offset === 0 ? capitalizeFirst(base) : base;
      },
      bump,
    );
  } else {
    result = replacePattern(
      result,
      /\b(?:it'?s|it is) not (?:just|only)\s+([^,.;!?]+?),\s*(?:it'?s|it is)\s+([^.;!?]+)/gi,
      (_, a, b, offset) => {
        const base = `${a.trim()} and also ${b.trim()}`;
        return offset === 0 ? `It's ${base}` : `it's ${base}`;
      },
      bump,
    );
    result = replacePattern(
      result,
      /\b(is|are) not (?:just|only)\s+([^,.;!?]+?),\s*(?:it'?s|it is|they'?re|they are)\s+([^.;!?]+)/gi,
      (_, verb, a, b, offset) => {
        const base = `${verb} ${a.trim()} and also ${b.trim()}`;
        return offset === 0 ? capitalizeFirst(base) : base;
      },
      bump,
    );
    result = replacePattern(
      result,
      /\bnot only\s+([^,.;!?]+?)(?:,\s*|\s+)but also\s+([^.;!?]+)/gi,
      (_, a, b, offset) => {
        const base = `${a.trim()} and ${b.trim()}`;
        return offset === 0 ? capitalizeFirst(base) : base;
      },
      bump,
    );
    result = replacePattern(
      result,
      /\b(?:isn'?t|is not) (?:just|only)\s+([^,.;!?]+?),\s*it'?s\s+([^.;!?]+)/gi,
      (_, a, b, offset) => {
        const base = `is ${a.trim()} and also ${b.trim()}`;
        return offset === 0 ? capitalizeFirst(base) : base;
      },
      bump,
    );
  }

  return result;
}

function applyRewrites(sentence, data, noteSwap) {
  let result = sentence;
  for (const [from, to] of data.phrases) {
    const replaced = swap(result, from, to);
    if (replaced.count) {
      result = replaced.text;
      noteSwap(from, to, replaced.count);
    }
  }
  for (const [from, to] of data.words) {
    const replaced = swap(result, from, to);
    if (replaced.count) {
      result = replaced.text;
      noteSwap(from, to, replaced.count);
    }
  }
  return result;
}

function replaceDashes(sentence, bump) {
  let count = 0;
  const result = sentence.replace(/(\S)\s*[—–]\s*/g, (_, before) => {
    count += 1;
    return `${before}, `;
  });
  if (count) bump('dashes', 'travessões convertidos em vírgulas', count);
  return result;
}

function replaceSemicolons(sentence, bump) {
  let count = 0;
  const result = sentence.replace(/;\s*(\p{L})/gu, (_, letter) => {
    count += 1;
    return `. ${letter.toUpperCase()}`;
  });
  if (count) bump('semicolons', 'pontos e vírgulas divididos em frases', count);
  return result;
}

function splitLongSentence(sentence, lang, bump) {
  if (countWords(sentence) <= 30) return sentence;

  const conjunction = lang === 'pt'
    ? /,\s+(e|mas|porém|contudo|portanto|então)\s+/gi
    : /,\s+(and|but|so|yet)\s+/gi;

  const pieces = sentence.split(conjunction);
  if (pieces.length < 3) return sentence;

  const out = [pieces[0]];
  let splits = 0;

  for (let i = 1; i < pieces.length; i += 2) {
    const conjunctionWord = pieces[i];
    const rest = pieces[i + 1] ?? '';
    const current = out[out.length - 1];

    if (countWords(current) >= 8 && countWords(rest) >= 6) {
      out.push(`. ${capitalizeFirst(conjunctionWord)} ${rest}`);
      splits += 1;
    } else {
      out.push(`, ${conjunctionWord} ${rest}`);
    }
  }

  if (splits) bump('long', 'frases longas divididas', splits);
  return out.join('');
}

function addContractions(sentence, bump) {
  let result = sentence;
  let total = 0;
  for (const [from, to] of CONTRACTIONS) {
    const replaced = swap(result, from, to);
    if (replaced.count) {
      result = replaced.text;
      total += replaced.count;
    }
  }
  if (total) bump('contractions', 'contrações adicionadas (inglês)', total);
  return result;
}

function fixArticles(sentence, bump) {
  let count = 0;
  const result = sentence.replace(/\b(a|an)\s+([\p{L}]+)/giu, (match, article, word) => {
    const lower = word.toLowerCase();
    const silentH = /^(hour|honest|honor|heir)/.test(lower);
    const consonantSound = /^(uni|use|usu|ute|uro|eu|one|once)/.test(lower);
    const needsAn = silentH || (/^[aeiou]/.test(lower) && !consonantSound);
    const chosen = needsAn ? 'an' : 'a';
    const cased = article[0] === article[0].toUpperCase()
      ? chosen[0].toUpperCase() + chosen.slice(1)
      : chosen;
    if (cased !== article) count += 1;
    return `${cased} ${word}`;
  });
  if (count) bump('articles', 'artigos corrigidos (a/an)', count);
  return result;
}

function cleanup(sentence) {
  return sentence
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/,\s*,+/g, ',')
    .replace(/(?<!\.)\.\s*\.(?!\.)/g, '.')
    .trim();
}

function rewriteBody(body, lang, data, state, bump, noteSwap) {
  const sentences = splitSentences(body);
  const rewritten = [];

  for (const sentence of sentences) {
    let current = sentence.trim();
    current = dropFiller(current, lang, bump);
    current = varyConnective(current, lang, state, bump);
    current = fixNotJust(current, lang, bump);
    current = applyRewrites(current, data, noteSwap);
    current = replaceDashes(current, bump);
    current = replaceSemicolons(current, bump);
    current = splitLongSentence(current, lang, bump);
    if (lang === 'en') current = addContractions(current, bump);
    if (lang === 'en') current = fixArticles(current, bump);
    current = cleanup(current);
    if (current) rewritten.push(current);
  }

  return capitalizeSentences(rewritten.join(' '));
}

function rewrite(input, options = {}) {
  const lang = options.lang || detectLanguage(input);
  const data = REWRITE[lang];
  const tallies = new Map();
  const swapLog = new Map();
  const state = { connectiveSeen: new Map(), usedReplacements: new Set() };

  const bump = (id, label, amount = 1) => {
    const current = tallies.get(id) || { id, label, count: 0 };
    current.count += amount;
    tallies.set(id, current);
  };

  const noteSwap = (from, to, count) => {
    const current = swapLog.get(from) || { from, to, count: 0 };
    current.count += count;
    swapLog.set(from, current);
    bump('lexicon', 'jargão trocado por termos simples', count);
  };

  const outputLines = [];
  let inFence = false;

  for (const rawLine of input.split(/\r?\n/)) {
    const trimmed = rawLine.trim();

    if (/^```/.test(trimmed)) {
      inFence = !inFence;
      outputLines.push(rawLine);
      continue;
    }
    if (inFence || trimmed === '') {
      outputLines.push(rawLine);
      continue;
    }
    if (/^#{1,6}\s/.test(trimmed) || /^\|/.test(trimmed)) {
      outputLines.push(rawLine);
      continue;
    }

    const prefixed = rawLine.match(/^(\s*(?:[-*•]|\d+[.)]|>)\s+)(.*)$/);
    const prefix = prefixed ? prefixed[1] : '';
    const body = (prefixed ? prefixed[2] : rawLine).replace(/\s+/g, ' ').trim();
    if (!body) {
      outputLines.push(rawLine);
      continue;
    }

    outputLines.push(prefix + rewriteBody(body, lang, data, state, bump, noteSwap));
  }

  const text = outputLines.join('\n');
  const edits = [...tallies.values()]
    .filter((edit) => edit.count > 0)
    .sort((a, b) => b.count - a.count);
  const swaps = [...swapLog.values()].sort((a, b) => b.count - a.count);

  return { text, lang, edits, swaps };
}

module.exports = { rewrite };

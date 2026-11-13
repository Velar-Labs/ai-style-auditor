'use strict';

const { escapeRegex, splitSentences, countWords, paragraphBlocks } = require('./text');
const { detectLanguage } = require('./lang');
const { LEXICON, FILLERS, CONNECTIVES, NOT_JUST_DETECT } = require('./patterns');

const NUMBERS_OR_MONTHS = /\b\d[\d.,]*\b|\b(?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|january|february|march|april|may|june|july|august|september|october|november|december)\b/gi;
const CONTRACTIONS_RE = /\b\w+(?:n't|'re|'ve|'ll|'d|'m)\b|\b(?:it|that|there|what|who)'s\b/gi;

const regexCache = new Map();

function cached(key, build) {
  if (!regexCache.has(key)) regexCache.set(key, build());
  return regexCache.get(key);
}

function lexiconRegex(lang) {
  return cached(`lexicon:${lang}`, () => {
    const lex = LEXICON[lang];
    const parts = [
      ...lex.words.map((word) => `\\b${escapeRegex(word)}\\b`),
      ...lex.phrases.map(escapeRegex),
    ];
    return new RegExp(parts.join('|'), 'gi');
  });
}

function fillerRegex(lang) {
  return cached(`fillers:${lang}`, () => (
    new RegExp(FILLERS[lang].map(escapeRegex).join('|'), 'gi')
  ));
}

function coefficientOfVariation(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

function bandFor(score) {
  if (score >= 70) return 'muito provavelmente gerado por IA';
  if (score >= 50) return 'provavelmente gerado por IA';
  if (score >= 30) return 'sinais mistos';
  return 'provavelmente escrito por humano';
}

function analyze(text, options = {}) {
  const clean = (text || '').trim();
  const lang = options.lang || detectLanguage(clean);
  const wordCount = countWords(clean);
  const sentences = splitSentences(clean.replace(/\s+/g, ' ')).filter((s) => s.trim());
  const sentenceCount = sentences.length;

  if (wordCount === 0) {
    return {
      lang,
      wordCount: 0,
      sentenceCount: 0,
      score: 0,
      band: bandFor(0),
      confidence: 'baixa',
      signals: [],
    };
  }

  const per100 = (amount) => (amount / wordCount) * 100;
  const signals = [];

  const lexMatches = clean.match(lexiconRegex(lang)) || [];
  if (lexMatches.length) {
    const density = per100(lexMatches.length);
    const points = Math.min(30, Math.round(density * 10));
    if (points > 0) {
      signals.push({
        id: 'lexicon',
        label: 'jargão típico de IA',
        points,
        detail: `${density.toFixed(1)} ocorrências por 100 palavras`,
        examples: [...new Set(lexMatches.map((m) => m.toLowerCase()))].slice(0, 6),
      });
    }
  }

  const fillerMatches = clean.match(fillerRegex(lang)) || [];
  if (fillerMatches.length) {
    signals.push({
      id: 'fillers',
      label: 'frases de preenchimento ("é importante notar...")',
      points: Math.min(16, fillerMatches.length * 5),
      detail: `${fillerMatches.length} ocorrência(s)`,
      examples: [...new Set(fillerMatches.map((m) => m.toLowerCase()))].slice(0, 4),
    });
  }

  const notJust = clean.match(NOT_JUST_DETECT[lang]) || [];
  if (notJust.length) {
    signals.push({
      id: 'contrast-formula',
      label: 'fórmula "não é apenas X, é Y"',
      points: Math.min(10, notJust.length * 5),
      detail: `${notJust.length} ocorrência(s)`,
    });
  }

  const dashCount = (clean.match(/[—–;]/g) || []).length;
  if (dashCount) {
    const points = Math.min(14, Math.round(per100(dashCount) * 8));
    if (points > 0) {
      signals.push({
        id: 'dashes',
        label: 'travessões e/ou ponto e vírgula em excesso',
        points,
        detail: `${dashCount} marcação(ões)`,
      });
    }
  }

  const lengths = sentences.map(countWords).filter((count) => count >= 3);
  if (lengths.length >= 5) {
    const variation = coefficientOfVariation(lengths);
    let points = 0;
    if (variation < 0.22) points = 16;
    else if (variation < 0.32) points = 12;
    else if (variation < 0.42) points = 6;
    if (points) {
      signals.push({
        id: 'uniformity',
        label: 'frases com comprimento muito uniforme',
        points,
        detail: `variação ${variation.toFixed(2)} (quanto menor, mais robótico)`,
      });
    }
  }

  const openerHits = new Map();
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    for (const [opener] of CONNECTIVES[lang]) {
      if (lower.startsWith(`${opener},`) || lower.startsWith(`${opener} `) || lower === opener) {
        openerHits.set(opener, (openerHits.get(opener) || 0) + 1);
        break;
      }
    }
  }
  const repetitions = [...openerHits.values()]
    .reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  if (repetitions > 0) {
    signals.push({
      id: 'connectives',
      label: 'conectivos repetidos no início das frases',
      points: Math.min(12, repetitions * 4),
      detail: `${repetitions} repetição(ões) de um mesmo abridor`,
    });
  }

  if (lang === 'en' && wordCount >= 100) {
    const contractions = (clean.match(CONTRACTIONS_RE) || []).length;
    if (contractions === 0) {
      signals.push({
        id: 'contractions',
        label: 'nenhuma contração em texto longo (registro muito formal)',
        points: 5,
        detail: 'texto humano costuma contrair ("it\'s", "don\'t")',
      });
    }
  }

  if (wordCount >= 200) {
    const specifics = (clean.match(NUMBERS_OR_MONTHS) || []).length;
    const density = per100(specifics);
    if (density < 0.5) {
      signals.push({
        id: 'specifics',
        label: 'poucos dados concretos (números, datas)',
        points: 4,
        detail: `${density.toFixed(1)} por 100 palavras`,
      });
    }
  }

  const blocks = paragraphBlocks(clean);
  if (blocks.length >= 3) {
    const counts = blocks.map((block) => (
      splitSentences(block.replace(/\s+/g, ' ')).length
    ));
    if (counts.every((count) => count >= 3 && count <= 5)) {
      signals.push({
        id: 'paragraphs',
        label: 'parágrafos com tamanho uniforme (3–5 frases)',
        points: 5,
        detail: `${blocks.length} parágrafos no mesmo ritmo`,
      });
    }
  }

  signals.sort((a, b) => b.points - a.points);
  const score = Math.min(100, signals.reduce((sum, signal) => sum + signal.points, 0));
  const confidence = wordCount >= 120 && sentenceCount >= 6
    ? 'alta'
    : wordCount >= 60 ? 'média' : 'baixa';

  return { lang, wordCount, sentenceCount, score, band: bandFor(score), confidence, signals };
}

module.exports = { analyze };

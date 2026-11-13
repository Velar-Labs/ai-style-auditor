'use strict';

const PT_STOPWORDS = new Set([
  'não', 'uma', 'isso', 'mais', 'como', 'dos', 'das', 'pelo', 'pela', 'também',
  'você', 'são', 'foi', 'tem', 'ser', 'sua', 'seu', 'nas', 'nos', 'ao', 'à',
  'às', 'é', 'em', 'um', 'os', 'as', 'do', 'da', 'no', 'na', 'se', 'por',
  'que', 'de', 'para', 'com', 'mas', 'ou', 'quando', 'porque', 'entre',
  'sobre', 'já', 'ainda', 'muito', 'pode', 'está', 'estão', 'era', 'eram',
  'há', 'após', 'antes', 'desde', 'sem', 'até', 'esse', 'essa', 'este',
  'esta', 'ele', 'ela', 'eles', 'elas', 'nós', 'eu', 'lhe', 'lhes',
]);

const EN_STOPWORDS = new Set([
  'the', 'and', 'that', 'with', 'this', 'is', 'are', 'for', 'of', 'to', 'it',
  'as', 'be', 'on', 'in', 'was', 'were', 'has', 'have', 'had', 'not', 'but',
  'from', 'they', 'we', 'you', 'at', 'by', 'an', 'or', 'which', 'their',
  'there', 'these', 'those', 'its', 'could', 'would', 'should', 'will', 'can',
  'been', 'being', 'more', 'than', 'about', 'into', 'over', 'such', 'also',
  'all', 'any', 'each', 'when', 'where', 'who', 'how', 'what', 'why', 'while',
  'because', 'between', 'through', 'during', 'after', 'before', 'under',
  'again', 'then', 'once', 'here', 'both', 'few', 'most', 'other', 'some',
  'own', 'same', 'too', 'very', 'just', 'now', 'only', 'our', 'your', 'my',
  'his', 'her', 'him', 'them',
]);

const PT_ACCENTS = /[ãõçáéíóúâêôà]/gi;

function detectLanguage(text) {
  if (!text || !text.trim()) return 'pt';
  const tokens = text.toLowerCase().match(/\p{L}+/gu) || [];
  let pt = 0;
  let en = 0;
  for (const token of tokens) {
    if (PT_STOPWORDS.has(token)) pt += 1;
    if (EN_STOPWORDS.has(token)) en += 1;
  }
  const accents = (text.match(PT_ACCENTS) || []).length;
  pt += accents * 2;
  return pt >= en ? 'pt' : 'en';
}

module.exports = { detectLanguage };

'use strict';

function sortPairs(pairs) {
  return [...pairs].sort((a, b) => b[0].length - a[0].length);
}

const PT_LEXICON = {
  words: [
    'crucial', 'cruciais', 'essencial', 'essenciais', 'fundamental', 'fundamentais',
    'abrangente', 'abrangentes', 'robusto', 'robusta', 'robustos', 'robustas',
    'cenário', 'cenários', 'panorama', 'intrincado', 'intrincada', 'intrincados',
    'intrincadas', 'nuance', 'nuances', 'otimizar', 'otimiza', 'otimizam',
    'fomentar', 'fomenta', 'potencializar', 'potencializa', 'holístico',
    'holística', 'sinergia', 'paradigma', 'paradigmas', 'ecossistema',
    'multifacetado', 'multifacetada', 'imprescindível', 'indispensável',
    'meticuloso', 'meticulosa', 'meticulosos', 'meticulosas', 'minucioso',
    'minuciosa', 'catalisador', 'tapeçaria', 'vibrante', 'vibrantes',
    'instigante', 'substancial', 'substanciais', 'transformador',
    'transformadora', 'revolucionário', 'revolucionária', 'dinâmico', 'dinâmica',
  ],
  phrases: [
    'desempenha um papel crucial', 'desempenha um papel fundamental',
    'desempenha um papel essencial', 'desempenham um papel crucial',
    'desempenham um papel fundamental', 'papel crucial', 'papel fundamental',
    'pedra angular', 'em constante evolução', 'no mundo atual',
    'no cenário atual', 'de forma abrangente', 'de forma significativa',
    'de forma robusta', 'desvendar os segredos', 'um leque de possibilidades',
    'solução inovadora', 'abordagem holística',
  ],
};

const EN_LEXICON = {
  words: [
    'delve', 'delves', 'delved', 'delving', 'tapestry', 'crucial', 'pivotal',
    'seamless', 'seamlessly', 'leverage', 'leverages', 'leveraged',
    'leveraging', 'robust', 'comprehensive', 'nuanced', 'intricate', 'foster',
    'fosters', 'fostered', 'underscore', 'underscores', 'underscored',
    'testament', 'elevate', 'elevates', 'unlock', 'unlocks', 'harness',
    'harnesses', 'meticulous', 'meticulously', 'vibrant', 'myriad', 'plethora',
    'paradigm', 'synergy', 'holistic', 'transformative', 'multifaceted',
    'embark', 'embarks', 'embarking', 'navigate', 'navigates', 'navigating',
    'intricacies', 'boasts', 'garner', 'adept', 'proficient', 'notably',
    'crucially', 'cutting-edge', 'game-changer', 'invaluable', 'paramount',
  ],
  phrases: [
    'in today\'s fast-paced world', 'in today\'s world', 'in an ever-evolving',
    'in the ever-evolving', 'plays a crucial role', 'plays a pivotal role',
    'plays a vital role', 'a testament to', 'when it comes to',
    'at the end of the day', 'a myriad of', 'a plethora of',
    'navigate the complexities', 'the realm of', 'the landscape of',
    'unlock the potential', 'harness the power',
  ],
};

const PT_FILLERS = [
  'é importante notar que', 'é importante destacar que',
  'é importante ressaltar que', 'é importante observar que',
  'vale ressaltar que', 'vale destacar que', 'vale notar que',
  'vale lembrar que', 'cabe destacar que', 'cabe ressaltar que',
  'cabe notar que', 'convém destacar que', 'convém ressaltar que',
  'é interessante notar que', 'é interessante observar que',
  'é válido destacar que', 'é válido ressaltar que',
];

const EN_FILLERS = [
  'it is important to note that', 'it\'s important to note that',
  'it is important to highlight that', 'it\'s important to highlight that',
  'it is worth noting that', 'it\'s worth noting that',
  'it is interesting to note that', 'it\'s interesting to note that',
  'needless to say', 'it goes without saying that',
];

const PT_CONNECTIVES = [
  ['em primeiro lugar', 'Primeiro,'],
  ['em segundo lugar', 'Depois,'],
  ['nesse sentido', 'Nisso,'],
  ['diante disso', 'Com isso,'],
  ['dessa forma', 'Por isso,'],
  ['dessa maneira', 'Por isso,'],
  ['em conclusão', 'No fim,'],
  ['em resumo', 'No fim,'],
  ['em suma', 'No fim,'],
  ['primeiramente', 'Primeiro,'],
  ['além disso', 'Também'],
  ['no entanto', 'Mas'],
  ['entretanto', 'Mas'],
  ['contudo', 'Mas'],
  ['portanto', 'Por isso,'],
  ['por fim', 'Por último,'],
  ['ademais', 'Também'],
  ['outrossim', 'Também'],
];

const EN_CONNECTIVES = [
  ['in conclusion', 'In the end,'],
  ['in summary', 'In the end,'],
  ['in addition', 'Also,'],
  ['furthermore', 'Also,'],
  ['additionally', 'Also,'],
  ['consequently', 'So,'],
  ['nevertheless', 'Still,'],
  ['nonetheless', 'Still,'],
  ['firstly', 'First,'],
  ['secondly', 'Second,'],
  ['lastly', 'Finally,'],
  ['moreover', 'Also,'],
  ['overall', 'In the end,'],
  ['however', 'But'],
  ['therefore', 'So,'],
  ['thus', 'So,'],
];

const PT_ALWAYS_REPLACE = new Set([
  'em primeiro lugar', 'em segundo lugar', 'em suma', 'em conclusão',
  'em resumo', 'primeiramente', 'ademais', 'outrossim',
]);

const EN_ALWAYS_REPLACE = new Set([
  'firstly', 'secondly', 'lastly', 'moreover', 'furthermore', 'additionally',
  'in conclusion', 'in summary', 'overall',
]);

const PT_REWRITE = {
  phrases: sortPairs([
    ['desempenha um papel crucial', 'é central'],
    ['desempenha um papel fundamental', 'é central'],
    ['desempenha um papel essencial', 'é central'],
    ['desempenham um papel crucial', 'são centrais'],
    ['desempenham um papel fundamental', 'são centrais'],
    ['desempenham um papel essencial', 'são centrais'],
    ['papel crucial', 'papel importante'],
    ['papel fundamental', 'papel importante'],
    ['pedra angular', 'base'],
    ['em constante evolução', 'que muda o tempo todo'],
    ['no mundo atual', 'hoje'],
    ['no cenário atual', 'hoje'],
    ['de forma abrangente', 'de modo amplo'],
    ['de forma significativa', 'bastante'],
    ['de forma robusta', 'com solidez'],
    ['desvendar os segredos', 'entender como funciona'],
    ['um leque de possibilidades', 'várias possibilidades'],
    ['solução inovadora', 'solução nova'],
    ['abordagem holística', 'abordagem completa'],
  ]),
  words: [
    ['crucial', 'importante'], ['cruciais', 'importantes'],
    ['essencial', 'importante'], ['essenciais', 'importantes'],
    ['fundamental', 'importante'], ['fundamentais', 'importantes'],
    ['abrangente', 'geral'], ['abrangentes', 'gerais'],
    ['robusto', 'confiável'], ['robusta', 'confiável'],
    ['robustos', 'confiáveis'], ['robustas', 'confiáveis'],
    ['cenário', 'contexto'], ['cenários', 'contextos'],
    ['panorama', 'visão geral'], ['intrincado', 'complexo'],
    ['intrincada', 'complexa'], ['intrincados', 'complexos'],
    ['intrincadas', 'complexas'], ['nuance', 'variação'],
    ['nuances', 'variações'], ['otimizar', 'melhorar'],
    ['otimiza', 'melhora'], ['otimizam', 'melhoram'],
    ['fomentar', 'incentivar'], ['fomenta', 'incentiva'],
    ['potencializar', 'aumentar'], ['potencializa', 'aumenta'],
    ['holístico', 'completo'], ['holística', 'completa'],
    ['sinergia', 'colaboração'], ['paradigma', 'modelo'],
    ['paradigmas', 'modelos'], ['ecossistema', 'ambiente'],
    ['multifacetado', 'complexo'], ['multifacetada', 'complexa'],
    ['imprescindível', 'importante'], ['indispensável', 'importante'],
    ['meticuloso', 'detalhista'], ['meticulosa', 'detalhista'],
    ['meticulosos', 'detalhistas'], ['meticulosas', 'detalhistas'],
    ['minucioso', 'detalhista'], ['minuciosa', 'detalhista'],
    ['minuciosos', 'detalhistas'], ['minuciosas', 'detalhistas'],
    ['catalisador', 'motor'], ['tapeçaria', 'conjunto'],
    ['instigante', 'interessante'], ['substancial', 'grande'],
    ['substanciais', 'grandes'], ['transformador', 'marcante'],
    ['transformadora', 'marcante'], ['revolucionário', 'novo'],
    ['revolucionária', 'nova'], ['mergulhar', 'entrar'],
    ['mergulhe', 'entre'], ['utilizar', 'usar'], ['utiliza', 'usa'],
    ['utilizam', 'usam'], ['utilizando', 'usando'],
    ['utilizado', 'usado'], ['utilizada', 'usada'],
    ['realizar', 'fazer'], ['realiza', 'faz'], ['realizam', 'fazem'],
    ['realizando', 'fazendo'], ['realizado', 'feito'],
    ['realizada', 'feita'], ['possibilitar', 'permitir'],
    ['possibilita', 'permite'], ['possibilitam', 'permitem'],
    ['demonstrar', 'mostrar'], ['demonstra', 'mostra'],
    ['demonstram', 'mostram'], ['evidenciar', 'mostrar'],
    ['evidencia', 'mostra'], ['evidenciam', 'mostram'],
    ['desvendar', 'entender'], ['desvenda', 'entende'],
  ],
};

const EN_REWRITE = {
  phrases: sortPairs([
    ['in today\'s fast-paced world', 'today'],
    ['in today\'s world', 'today'],
    ['in the ever-evolving', 'in the changing'],
    ['in an ever-evolving', 'in a changing'],
    ['plays a crucial role', 'is central'],
    ['plays a pivotal role', 'is key'],
    ['plays a vital role', 'is vital'],
    ['a testament to', 'proof of'],
    ['when it comes to', 'for'],
    ['at the end of the day', 'in the end'],
    ['a myriad of', 'many'],
    ['a plethora of', 'many'],
    ['navigate the complexities', 'handle the details'],
    ['the realm of', 'the field of'],
    ['the landscape of', 'the field of'],
    ['unlock the potential', 'open up the potential'],
    ['harness the power', 'use the power'],
    ['in order to', 'to'],
    ['due to the fact that', 'because'],
    ['a large number of', 'many'],
    ['at this point in time', 'now'],
    ['prior to', 'before'],
    ['subsequent to', 'after'],
    ['in the event that', 'if'],
    ['delve into', 'look at'],
    ['embark on', 'start'],
    ['cutting-edge', 'modern'],
    ['game-changer', 'big change'],
  ]),
  words: [
    ['utilize', 'use'], ['utilizes', 'uses'], ['utilized', 'used'],
    ['utilizing', 'using'], ['leverage', 'use'], ['leverages', 'uses'],
    ['leveraged', 'used'], ['leveraging', 'using'], ['facilitate', 'help'],
    ['facilitates', 'helps'], ['facilitated', 'helped'],
    ['demonstrate', 'show'], ['demonstrates', 'shows'],
    ['demonstrated', 'showed'], ['comprehensive', 'thorough'],
    ['robust', 'strong'], ['crucial', 'important'], ['pivotal', 'key'],
    ['seamless', 'smooth'], ['seamlessly', 'smoothly'],
    ['foster', 'encourage'], ['fosters', 'encourages'],
    ['fostered', 'encouraged'], ['myriad', 'many'], ['plethora', 'many'],
    ['intricate', 'complex'], ['intricacies', 'details'],
    ['embark', 'start'], ['embarks', 'starts'], ['embarking', 'starting'],
    ['navigate', 'handle'], ['navigates', 'handles'],
    ['navigating', 'handling'], ['underscore', 'highlight'],
    ['underscores', 'highlights'], ['underscored', 'highlighted'],
    ['testament', 'proof'], ['elevate', 'raise'], ['elevates', 'raises'],
    ['unlock', 'open up'], ['unlocks', 'opens up'], ['harness', 'use'],
    ['harnesses', 'uses'], ['meticulous', 'careful'],
    ['meticulously', 'carefully'], ['paramount', 'very important'],
    ['invaluable', 'very useful'], ['multifaceted', 'complex'],
    ['profound', 'deep'], ['boasts', 'has'], ['boast', 'have'],
    ['garner', 'get'], ['garners', 'gets'], ['adept', 'skilled'],
    ['proficient', 'skilled'], ['delve', 'dig'], ['delves', 'digs'],
    ['delved', 'dug'], ['delving', 'digging'], ['tapestry', 'mix'],
    ['paradigm', 'model'], ['synergy', 'teamwork'], ['holistic', 'complete'],
    ['transformative', 'major'], ['revolutionary', 'new'],
    ['crucially', 'importantly'], ['notably', 'especially'],
  ],
};

const CONTRACTIONS = [
  ['cannot', 'can\'t'], ['will not', 'won\'t'], ['would not', 'wouldn\'t'],
  ['should not', 'shouldn\'t'], ['could not', 'couldn\'t'],
  ['does not', 'doesn\'t'], ['do not', 'don\'t'], ['did not', 'didn\'t'],
  ['is not', 'isn\'t'], ['are not', 'aren\'t'], ['was not', 'wasn\'t'],
  ['were not', 'weren\'t'], ['have not', 'haven\'t'],
  ['has not', 'hasn\'t'], ['had not', 'hadn\'t'], ['it is', 'it\'s'],
  ['that is', 'that\'s'], ['there is', 'there\'s'], ['what is', 'what\'s'],
  ['who is', 'who\'s'], ['you are', 'you\'re'], ['we are', 'we\'re'],
  ['they are', 'they\'re'], ['I am', 'I\'m'], ['we have', 'we\'ve'],
  ['they have', 'they\'ve'], ['you have', 'you\'ve'], ['let us', 'let\'s'],
];

const CONTRAST_FORMULA = {
  pt: /(?:não|nem)\s+(?:é|são|foi|foram)\s+(?:(?:apenas|somente|só)\s+)?[^,.;!?]{1,50},\s*(?:é|são|foi|foram|nem|mas)\s+[^,.;!?]{1,60}|\bnão\s+(?:apenas|somente|só)\b/gi,
  en: /\b(?:is|are|was|were)\s+not\s+(?:(?:just|only)\s+)?[^,.;!?]{1,50},\s*(?:it'?s|it is|they'?re|they are|but|nor)\s+[^,.;!?]{1,60}|\b(?:it'?s|it is|isn'?t|is not)\s+(?:just|only)\b|\bnot\s+(?:just|only)\b/gi,
};

const NEGATION_WORDS = {
  pt: /\b(?:não|nunca|jamais|nem|nenhum|nenhuma|nenhuns|nenhumas|ninguém|nada)\b/gi,
  en: /\b(?:not|never|no|none|nobody|nothing|neither|nor)\b|\b\w+n't\b/gi,
};

const APHORISM_OPENERS = {
  pt: /^(?:o segredo|a verdade|a questão|o ponto|a chave|o truque|a lição|o desafio|o futuro)\s+(?:não\s+)?(?:é|são|está|estão)(?=[\s,.;:!?]|$)/i,
  en: /^(?:the secret|the truth|the key|the point|the trick|the lesson|the challenge)\s+(?:is|isn'?t|are|aren'?t)(?=[\s,.;:!?]|$)/i,
};

const LEXICON = { pt: PT_LEXICON, en: EN_LEXICON };
const FILLERS = { pt: PT_FILLERS, en: EN_FILLERS };
const CONNECTIVES = {
  pt: sortPairs(PT_CONNECTIVES),
  en: sortPairs(EN_CONNECTIVES),
};
const ALWAYS_REPLACE = { pt: PT_ALWAYS_REPLACE, en: EN_ALWAYS_REPLACE };
const REWRITE = { pt: PT_REWRITE, en: EN_REWRITE };

module.exports = {
  LEXICON,
  FILLERS,
  CONNECTIVES,
  ALWAYS_REPLACE,
  REWRITE,
  CONTRACTIONS,
  CONTRAST_FORMULA,
  NEGATION_WORDS,
  APHORISM_OPENERS,
};

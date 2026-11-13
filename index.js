#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { analyze } = require('./src/detect');
const { rewrite } = require('./src/rewrite');

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (text) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : text);
const bold = paint('1');
const dim = paint('2');
const red = paint('31');
const yellow = paint('33');
const green = paint('32');
const cyan = paint('36');

function colorFor(score) {
  if (score >= 70) return red;
  if (score >= 40) return yellow;
  return green;
}

function bar(score) {
  const filled = Math.round((score / 100) * 18);
  return '█'.repeat(filled) + '░'.repeat(18 - filled);
}

function printAnalysis(analysis) {
  const langName = analysis.lang === 'pt' ? 'português' : 'inglês';
  console.log(`${bold('Idioma:')} ${langName} · ${analysis.wordCount} palavras · ${analysis.sentenceCount} frases · confiança ${analysis.confidence}`);
  console.log('');
  const color = colorFor(analysis.score);
  console.log(`${bold('Sinais de IA:')} ${color(`${analysis.score}/100`)} ${color(bar(analysis.score))} ${analysis.band}`);

  if (analysis.signals.length) {
    console.log('');
    console.log(bold('Detalhes:'));
    for (const signal of analysis.signals) {
      const points = `+${signal.points}`.padStart(4);
      const detail = signal.detail ? dim(` — ${signal.detail}`) : '';
      console.log(`  ${color(points)}  ${signal.label}${detail}`);
      if (signal.examples && signal.examples.length) {
        console.log(`       ${dim(`ex.: ${signal.examples.join(', ')}`)}`);
      }
    }
  } else {
    console.log(dim('Nenhum sinal relevante encontrado.'));
  }

  console.log('');
  console.log(dim('Heurística de estilo, não um detector confiável. Trate a pontuação como indício.'));
}

function printHelp() {
  console.log(`${bold('Detector e reescritor de texto com marcas de IA')}

${bold('Uso:')}
  node index.js detect <arquivo|->          Analisa o texto e mostra os sinais
  node index.js rewrite <arquivo|-> [...]   Reescreve e mostra antes/depois
  node index.js <arquivo> [...]             Atalho para rewrite

${bold('Opções:')}
  -o, --out <arquivo>   Salva o texto reescrito no arquivo
  --lang pt|en          Força o idioma (padrão: detecção automática)
  --json                Saída em JSON
  -h, --help            Mostra esta ajuda

${bold('Exemplos:')}
  node index.js detect exemplos/ia-pt.txt
  node index.js rewrite exemplos/ia-pt.txt --out saida.txt
  cat texto.txt | node index.js rewrite -

${dim('A reescrita é rule-based: revise o resultado, principalmente termos técnicos.')}`);
}

function parseArgs(argv) {
  const options = {
    command: null, file: null, out: null, lang: null, json: false, help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '-o' || arg === '--out') {
      options.out = argv[i + 1];
      i += 1;
    } else if (arg === '--lang') {
      options.lang = argv[i + 1];
      i += 1;
    } else if ((arg === 'detect' || arg === 'rewrite') && !options.command && !options.file) {
      options.command = arg;
    } else if (!options.file) {
      options.file = arg;
    }
  }

  return options;
}

function readInput(file) {
  if (!file || file === '-') return fs.readFileSync(0, 'utf8');
  return fs.readFileSync(file, 'utf8');
}

function writeOutput(file, text) {
  const target = path.resolve(file);
  fs.writeFileSync(target, text.endsWith('\n') ? text : `${text}\n`, 'utf8');
  return target;
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help || (!options.command && !options.file)) {
    printHelp();
    return;
  }
  if (options.lang && !['pt', 'en'].includes(options.lang)) {
    console.error(red('Idioma inválido. Use --lang pt ou --lang en.'));
    process.exitCode = 1;
    return;
  }

  let text;
  try {
    text = readInput(options.file);
  } catch (error) {
    console.error(red(`Não foi possível ler o texto: ${error.message}`));
    process.exitCode = 1;
    return;
  }
  if (!text.trim()) {
    console.error(red('Texto vazio.'));
    process.exitCode = 1;
    return;
  }

  const command = options.command || 'rewrite';
  const lang = options.lang || undefined;

  if (command === 'detect') {
    const analysis = analyze(text, { lang });
    if (options.json) console.log(JSON.stringify(analysis, null, 2));
    else printAnalysis(analysis);
    return;
  }

  const before = analyze(text, { lang });
  const result = rewrite(text, { lang: before.lang });
  const after = analyze(result.text, { lang: before.lang });

  if (options.json) {
    if (options.out) writeOutput(options.out, result.text);
    console.log(JSON.stringify({
      before, after, edits: result.edits, swaps: result.swaps, text: result.text,
    }, null, 2));
    return;
  }

  const beforeColor = colorFor(before.score);
  const afterColor = colorFor(after.score);
  console.log(`${bold('Antes:')}  ${beforeColor(`${before.score}/100`)} ${beforeColor(bar(before.score))} ${before.band}`);
  console.log(`${bold('Depois:')} ${afterColor(`${after.score}/100`)} ${afterColor(bar(after.score))} ${after.band}`);
  console.log('');

  if (result.edits.length) {
    console.log(bold('Mudanças:'));
    for (const edit of result.edits) {
      console.log(`  ${cyan(`${edit.count}×`)} ${edit.label}`);
    }
    if (result.swaps.length) {
      const terms = result.swaps.slice(0, 8).map((item) => `${item.from} → ${item.to}`).join(', ');
      console.log(dim(`  termos: ${terms}`));
    }
  } else {
    console.log(dim('Nenhuma mudança necessária.'));
  }

  console.log('');
  if (options.out) {
    const target = writeOutput(options.out, result.text);
    console.log(`${green('Arquivo salvo:')} ${target}`);
  } else {
    console.log(bold('Texto reescrito:'));
    console.log('');
    console.log(result.text);
  }

  console.log('');
  console.log(dim('Revise o resultado: a reescrita é automática e pode alterar nuances.'));
}

main();

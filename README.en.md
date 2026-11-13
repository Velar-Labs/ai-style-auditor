# AI Style Auditor

[Português](README.md) · [English](README.en.md)

A dependency-free Node.js CLI that audits stylistic markers commonly found in AI-generated text and rewrites the text with a more natural tone. Works with Portuguese and English, fully offline. Includes a local graphical interface in the browser.

> **Important:** this tool estimates *style signals* (jargon, contrast formulas, triads, negation strings, repetition, uniformity). It does not identify authorship, and no AI detector is reliable. Use it to revise your own writing and follow your institution's rules.

## Download

- **Windows x64:** download the [executable from the latest release](https://github.com/Velar-Labs/ai-style-auditor/releases/latest/download/ai-style-auditor.exe) — Node.js is not required.
- **Source code:** `git clone https://github.com/Velar-Labs/ai-style-auditor.git`

## What it does

- **Analyzes** the text and assigns a 0–100 score, listing each detected signal with examples.
- **Rewrites** the text: removes filler phrases, varies repeated connectives, swaps jargon for plain terms, splits long sentences, converts dashes and adjusts contractions in English.
- Shows a **before/after** score and logs every change.
- Preserves Markdown headings, code fences and list markers.
- Sends nothing to a server: everything runs locally.

## Requirements

- Node.js 18 or newer (tested on Node 24).
- No external dependencies: no `npm install` needed.

## Usage

```bash
# analyze only
node index.js detect exemplos/ia-en.txt

# rewrite to stdout
node index.js rewrite exemplos/ia-en.txt

# rewrite and save
node index.js rewrite exemplos/ia-en.txt --out rewritten.txt

# shortcut
node index.js exemplos/ia-en.txt

# text from another command
cat text.txt | node index.js rewrite -
```

Typical output:

```text
Before: 68/100 ████████████░░░░░░ probably AI-generated
After:   6/100 █░░░░░░░░░░░░░░░░░ probably human-written

Changes:
  14× jargon replaced with plain terms
  4× connectives simplified
  2× filler phrases removed
```

## Graphical interface

```bash
node index.js gui
```

Opens `http://127.0.0.1:4319` in your browser. Paste the text, pick a language and use **Analyze** or **Rewrite**; the result can be copied, downloaded as `.txt` or reused as input. The page runs on localhost only, sends nothing over the internet and has no access to your files.

If the project is packaged as a Windows executable, launching the `.exe` without arguments starts the interface.

## Commands and options

| Command / option | Description |
|---|---|
| `detect <file>` | Analyze and show style signals |
| `rewrite <file>` | Rewrite and show before/after |
| `<file>` | Shortcut for `rewrite` |
| `gui` | Open the graphical interface in the browser |
| `-` | Read from stdin |
| `-o, --out <file>` | Save the rewritten text |
| `--lang pt\|en` | Force the language (default: auto-detect) |
| `--json` | JSON output |
| `-h, --help` | Help |

## How the score is built

| Signal | Max points |
|---|---|
| AI-typical jargon | 30 |
| Filler phrases ("it is important to note...") | 16 |
| Uniform sentence length | 16 |
| Excessive em dashes and semicolons | 14 |
| Repeated sentence-opening connectives | 12 |
| "Not just X, it's Y" formula | 10 |
| Uniform paragraph size | 5 |
| No contractions in English | 5 |
| Few concrete details (numbers, dates) | 4 |

Bands: **0–29** probably human · **30–49** mixed signals · **50–69** probably AI · **70–100** very likely AI.

## Project layout

```text
index.js            CLI
src/gui.js          local interface server
src/gui.html        interface page (HTML/CSS/JS)
src/detect.js       heuristic scoring
src/rewrite.js      rewrite pipeline
src/patterns.js     pt/en lexicons and tables
src/text.js         sentences, words, abbreviations
src/lang.js         language detection
exemplos/           sample texts
test/               node:test suite
```

## Tests

```bash
npm test
```

## Limitations

- This is a style heuristic, not an authorship classifier. Human text can score high and AI text can score low.
- Rewriting is rule-based and may change nuances. Review the output, especially technical terms.
- Portuguese gender/number agreement relies on conservative word mappings; double-check unusual adjectives.

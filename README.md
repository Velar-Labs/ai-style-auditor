# AI Style Auditor

[Português](README.md) · [English](README.en.md)

CLI em Node.js, sem dependências, para auditar marcas de estilo típicas de textos gerados por IA e reescrever o texto com um tom mais natural. Funciona com português e inglês, offline.

> **Importante:** a ferramenta estima *sinais de estilo* (jargão, repetição, uniformidade). Ela não identifica autoria e nenhum detector de IA é confiável. Use para revisar seus próprios textos e respeite as regras da sua instituição.

## O que faz

- **Analisa** o texto e atribui uma pontuação de 0 a 100, com a lista de sinais encontrados e exemplos.
- **Reescreve** o texto: remove frases de preenchimento, varia conectivos repetidos, troca jargão por termos simples, divide frases longas, converte travessões e ajusta contrações em inglês.
- Mostra **antes/depois** e registra cada mudança aplicada.
- Preserva títulos Markdown, blocos de código e marcadores de lista.
- Não envia o texto para nenhum servidor: tudo roda localmente.

## Requisitos

- Node.js 18 ou superior (testado no Node 24).
- Nenhuma dependência externa: não é necessário `npm install`.

## Uso

```bash
# analisar sem alterar
node index.js detect exemplos/ia-pt.txt

# reescrever no terminal
node index.js rewrite exemplos/ia-pt.txt

# reescrever e salvar
node index.js rewrite exemplos/ia-pt.txt --out texto-reescrito.txt

# atalho
node index.js exemplos/ia-pt.txt

# texto vindo de outro comando
cat texto.txt | node index.js rewrite -
```

Saída típica:

```text
Antes:  72/100 █████████████░░░░░ muito provavelmente gerado por IA
Depois: 14/100 ███░░░░░░░░░░░░░░░ provavelmente escrito por humano

Mudanças:
  18× jargão trocado por termos simples
  3× frases de preenchimento removidas
  2× conectivos simplificados
```

## Comandos e opções

| Comando / opção | Descrição |
|---|---|
| `detect <arquivo>` | Analisa e mostra os sinais de estilo |
| `rewrite <arquivo>` | Reescreve e mostra antes/depois |
| `<arquivo>` | Atalho para `rewrite` |
| `-` | Lê da entrada padrão (stdin) |
| `-o, --out <arquivo>` | Salva o texto reescrito |
| `--lang pt\|en` | Força o idioma (padrão: detecção automática) |
| `--json` | Saída em JSON |
| `-h, --help` | Ajuda |

## Como a pontuação é composta

| Sinal | Peso máximo |
|---|---|
| Jargão típico de IA | 30 |
| Frases de preenchimento ("é importante notar...") | 16 |
| Uniformidade do comprimento das frases | 16 |
| Travessões e ponto e vírgula em excesso | 14 |
| Conectivos repetidos no início das frases | 12 |
| Fórmula "não é apenas X, é Y" | 10 |
| Parágrafos com tamanho uniforme | 5 |
| Ausência de contrações em inglês | 5 |
| Poucos dados concretos (números, datas) | 4 |

Faixas: **0–29** provavelmente humano · **30–49** sinais mistos · **50–69** provavelmente IA · **70–100** muito provavelmente IA.

## Estrutura

```text
index.js            CLI
src/detect.js       pontuação heurística
src/rewrite.js      pipeline de reescrita
src/patterns.js     léxicos e tabelas pt/en
src/text.js         frases, palavras, abreviações
src/lang.js         detecção de idioma
exemplos/           textos de exemplo
test/               testes com node:test
```

## Testes

```bash
npm test
```

## Limitações

- É uma heurística de estilo, não um classificador de autoria. Textos humanos podem pontuar alto e textos de IA podem pontuar baixo.
- A reescrita é baseada em regras e pode alterar nuances. Revise o resultado, principalmente termos técnicos.
- Concordância de gênero/número em português é tratada por mapeamentos conservadores; revise adjetivos incomuns.

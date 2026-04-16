const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const db = require('../database');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// Schema pro JSON estruturado que o Claude devolve
const extractionSchema = {
  type: 'object',
  properties: {
    eventos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tipo: {
            type: 'string',
            enum: ['matriz', 'touro', 'inseminacao', 'bezerro', 'pesagem', 'sanitario', 'alimentacao', 'financeiro', 'outro'],
          },
          confianca: { type: 'number', minimum: 0, maximum: 1 },
          texto_original: { type: 'string' },
          // Campos comuns (nem todos se aplicam a todo tipo)
          data: { type: ['string', 'null'] },
          animal_ref: { type: ['string', 'null'], description: 'Como o animal foi referido: "vaca 23", "Mimosa", "brinco 101"' },
          animal_tipo: { type: ['string', 'null'], enum: ['matriz', 'bezerro', 'touro', null] },
          numero: { type: ['string', 'null'] },
          nome: { type: ['string', 'null'] },
          raca: { type: ['string', 'null'] },
          // Inseminação
          tipo_inseminacao: { type: ['string', 'null'], enum: ['IA', 'MN', null] },
          touro_semen: { type: ['string', 'null'] },
          resultado: { type: ['string', 'null'], enum: ['pendente', 'prenha', 'vazia', null] },
          // Bezerro (parto)
          matriz_ref: { type: ['string', 'null'] },
          sexo: { type: ['string', 'null'], enum: ['M', 'F', null] },
          peso_nascimento: { type: ['number', 'null'] },
          // Pesagem
          peso: { type: ['number', 'null'] },
          // Sanitário
          sanitario_tipo: { type: ['string', 'null'], enum: ['vacina', 'vermifugo', 'tratamento', 'exame', null] },
          dose: { type: ['string', 'null'] },
          proxima_data: { type: ['string', 'null'] },
          veterinario: { type: ['string', 'null'] },
          custo: { type: ['number', 'null'] },
          // Alimentação
          alimentacao_tipo: { type: ['string', 'null'], enum: ['sal', 'racao', null] },
          sal_nome: { type: ['string', 'null'] },
          sal_marca: { type: ['string', 'null'] },
          sal_preco: { type: ['number', 'null'] },
          // Financeiro
          financeiro_tipo: { type: ['string', 'null'], enum: ['receita', 'despesa', null] },
          categoria: { type: ['string', 'null'] },
          descricao: { type: ['string', 'null'] },
          valor: { type: ['number', 'null'] },
          observacoes: { type: ['string', 'null'] },
        },
        required: ['tipo', 'confianca', 'texto_original'],
      },
    },
  },
  required: ['eventos'],
};

function buildSystemPrompt(contextoAnimais) {
  return `Você é um extrator especializado em anotações manuscritas de fazenda (controle de rebanho bovino em PT-BR).

Seu trabalho: ler UMA imagem de folha de caderno com anotações à mão e devolver JSON estruturado com TODOS os eventos que conseguir identificar.

REGRAS CRÍTICAS:
1. Se um campo for ilegível ou não estiver explícito no texto, use null. NUNCA invente peso, data, nome ou número.
2. Datas SEMPRE no formato ISO YYYY-MM-DD. Se o ano estiver ausente, assuma o ano atual (${new Date().getFullYear()}).
3. Datas curtas tipo "15/4" → "2026-04-15". "15/04/26" → "2026-04-15".
4. Pesos em kg, sempre number. "32kg" → 32. "1,5" → 1.5.
5. Sempre preencha "texto_original" com a transcrição literal da linha/trecho que gerou o evento.
6. Sempre preencha "confianca" entre 0 e 1 (sua autoavaliação honesta). <0.6 se você teve dúvida séria.
7. Um registro por evento — se uma linha menciona "parto dia 12, bezerro 35kg", são DOIS eventos (bezerro + pesagem opcional).

TIPOS DE EVENTO:
- matriz: cadastro de nova vaca/novilha matriz (número + nome + raça opcional)
- touro: cadastro de novo touro
- inseminacao: IA ou monta natural de uma matriz (matriz_ref + data + tipo_inseminacao + touro_semen)
- bezerro: nascimento/parto (numero do brinco + matriz_ref mãe + data + sexo M/F + peso_nascimento opcional)
- pesagem: pesagem de bezerro (animal_ref + data + peso)
- sanitario: vacina/vermífugo/tratamento (animal_ref + animal_tipo + sanitario_tipo + nome do produto + data + proxima_data opcional + dose opcional + custo opcional)
- alimentacao: início de sal/ração (animal_ref + alimentacao_tipo + sal_nome opcional + sal_marca opcional + sal_preco opcional + data inicio)
- financeiro: receita ou despesa (financeiro_tipo + categoria + valor + data + descricao)
- outro: anotação que não se encaixa — descreva em observacoes

CAMPO animal_ref:
Copie como o usuário escreveu: "vaca 23", "matriz 45", "Mimosa", "brinco 101", "bezerro da Mimosa". O backend tenta casar depois.

${contextoAnimais ? `\nCONTEXTO (animais já cadastrados no sistema — use pra ajudar a resolver referências):\n${contextoAnimais}` : ''}

Devolva APENAS o JSON estruturado conforme schema. Nada mais.`;
}

function buildAnimalContext() {
  const parts = [];
  const matrizes = db.prepare('SELECT numero, nome FROM matrizes WHERE status = ? ORDER BY numero').all('ativa');
  if (matrizes.length) parts.push('Matrizes ativas: ' + matrizes.map(m => `#${m.numero}${m.nome ? ` (${m.nome})` : ''}`).join(', '));

  const touros = db.prepare('SELECT numero, nome FROM touros WHERE status = ? ORDER BY numero').all('ativo');
  if (touros.length) parts.push('Touros ativos: ' + touros.map(t => `#${t.numero}${t.nome ? ` (${t.nome})` : ''}`).join(', '));

  const bezerros = db.prepare("SELECT numero FROM bezerros WHERE destino = 'na_fazenda' ORDER BY numero LIMIT 100").all();
  if (bezerros.length) parts.push('Bezerros na fazenda: ' + bezerros.map(b => `#${b.numero}`).join(', '));

  return parts.join('\n');
}

// Localiza cli.js do claude-code (evita o .cmd que dá problema de escape no Windows)
function findClaudeCliJs() {
  if (process.platform === 'win32') {
    const appdata = process.env.APPDATA;
    if (appdata) {
      const p = path.join(appdata, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
      if (fs.existsSync(p)) return p;
    }
  }
  // Fallback unix-ish
  const candidates = [
    '/usr/local/lib/node_modules/@anthropic-ai/claude-code/cli.js',
    path.join(os.homedir(), '.npm-global', 'lib', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js'),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

const CLAUDE_CLI_JS = findClaudeCliJs();

function runClaudeExtraction(imagePath) {
  return new Promise((resolve, reject) => {
    if (!CLAUDE_CLI_JS) return reject(new Error('claude-code cli.js não encontrado'));

    const systemPrompt = buildSystemPrompt(buildAnimalContext());
    const userPrompt = `Use a tool Read para abrir a imagem em "${imagePath.replace(/\\/g, '/')}" e extraia TODOS os eventos de fazenda que conseguir identificar conforme o schema.`;

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-'));

    const args = [
      CLAUDE_CLI_JS,
      '-p', userPrompt,
      '--append-system-prompt', systemPrompt,
      '--json-schema', JSON.stringify(extractionSchema),
      '--output-format', 'json',
      '--model', 'sonnet',
      '--disable-slash-commands',
      '--setting-sources', '',
      '--allowedTools', 'Read',
      '--permission-mode', 'bypassPermissions',
    ];

    const proc = spawn(process.execPath, args, {
      cwd: tmpDir,
      shell: false,
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Claude CLI exit ${code}: ${stderr.slice(0, 500)}`));
      }
      try {
        const parsed = JSON.parse(stdout);
        if (parsed.is_error) return reject(new Error(parsed.result || 'Claude error'));
        resolve({
          eventos: parsed.structured_output?.eventos || [],
          usage: parsed.usage,
          duration_ms: parsed.duration_ms,
        });
      } catch (e) {
        reject(new Error('Falha ao parsear resposta do Claude: ' + e.message + '\n' + stdout.slice(0, 500)));
      }
    });

    proc.on('error', (err) => reject(err));
  });
}

// POST /api/ocr/extract — recebe 1 ou N fotos, retorna JSON estruturado
router.post('/extract', upload.array('fotos', 20), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Nenhuma foto enviada' });
  }

  const results = [];
  for (const file of req.files) {
    try {
      // Resize/normalize pra 1800px lado maior + auto-rotate EXIF
      const resizedPath = file.path + '.resized.jpg';
      await sharp(file.path)
        .rotate()
        .resize(1800, 1800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 88 })
        .toFile(resizedPath);

      const extraction = await runClaudeExtraction(resizedPath);
      results.push({
        filename: file.originalname,
        preview_url: `/uploads/${path.basename(file.path)}`,
        eventos: extraction.eventos,
        usage: extraction.usage,
        duration_ms: extraction.duration_ms,
      });

      // Limpa resized (mantém original pra preview)
      try { fs.unlinkSync(resizedPath); } catch (_) {}
    } catch (err) {
      results.push({ filename: file.originalname, error: err.message, eventos: [] });
    }
  }

  res.json({ results });
});

// POST /api/ocr/commit — recebe eventos aprovados e grava no DB
router.post('/commit', (req, res) => {
  const { eventos } = req.body;
  if (!Array.isArray(eventos)) {
    return res.status(400).json({ error: 'eventos deve ser um array' });
  }

  const gravados = [];
  const erros = [];

  const findMatriz = (ref) => {
    if (!ref) return null;
    const n = String(ref).match(/\d+/)?.[0];
    if (n) {
      const byNum = db.prepare('SELECT id FROM matrizes WHERE numero = ?').get(n);
      if (byNum) return byNum.id;
    }
    const byName = db.prepare('SELECT id FROM matrizes WHERE nome LIKE ?').get(`%${ref}%`);
    return byName?.id || null;
  };
  const findTouro = (ref) => {
    if (!ref) return null;
    const n = String(ref).match(/\d+/)?.[0];
    if (n) {
      const byNum = db.prepare('SELECT id FROM touros WHERE numero = ?').get(n);
      if (byNum) return byNum.id;
    }
    return null;
  };
  const findBezerro = (ref) => {
    if (!ref) return null;
    const n = String(ref).match(/\d+/)?.[0];
    if (n) {
      const byNum = db.prepare('SELECT id FROM bezerros WHERE numero = ?').get(n);
      if (byNum) return byNum.id;
    }
    return null;
  };
  const findAnimal = (tipo, ref) => {
    if (tipo === 'matriz') return findMatriz(ref);
    if (tipo === 'bezerro') return findBezerro(ref);
    if (tipo === 'touro') return findTouro(ref);
    return null;
  };

  for (const ev of eventos) {
    try {
      let id;
      switch (ev.tipo) {
        case 'matriz': {
          if (!ev.numero) throw new Error('Matriz sem número');
          const r = db.prepare('INSERT INTO matrizes (numero, nome, data_nascimento, raca, observacoes) VALUES (?, ?, ?, ?, ?)')
            .run(ev.numero, ev.nome || null, ev.data || null, ev.raca || null, ev.observacoes || null);
          id = r.lastInsertRowid;
          break;
        }
        case 'touro': {
          if (!ev.numero) throw new Error('Touro sem número');
          const r = db.prepare('INSERT INTO touros (numero, nome, raca, data_nascimento, observacoes) VALUES (?, ?, ?, ?, ?)')
            .run(ev.numero, ev.nome || null, ev.raca || null, ev.data || null, ev.observacoes || null);
          id = r.lastInsertRowid;
          break;
        }
        case 'inseminacao': {
          const matriz_id = findMatriz(ev.matriz_ref || ev.animal_ref);
          if (!matriz_id) throw new Error('Matriz não encontrada: ' + (ev.matriz_ref || ev.animal_ref));
          if (!ev.data) throw new Error('Inseminação sem data');
          const r = db.prepare('INSERT INTO inseminacoes (matriz_id, data, tipo, touro_semen, observacoes) VALUES (?, ?, ?, ?, ?)')
            .run(matriz_id, ev.data, ev.tipo_inseminacao || 'IA', ev.touro_semen || null, ev.observacoes || null);
          id = r.lastInsertRowid;
          break;
        }
        case 'bezerro': {
          const matriz_id = findMatriz(ev.matriz_ref);
          if (!matriz_id) throw new Error('Matriz do bezerro não encontrada: ' + ev.matriz_ref);
          if (!ev.numero) throw new Error('Bezerro sem número');
          if (!ev.data) throw new Error('Bezerro sem data de nascimento');
          if (!ev.sexo) throw new Error('Bezerro sem sexo');
          const tc = ev.tipo_inseminacao || 'MN';
          const r = db.prepare('INSERT INTO bezerros (numero, matriz_id, data_nascimento, sexo, tipo_concepcao, peso_nascimento, peso_atual, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .run(ev.numero, matriz_id, ev.data, ev.sexo, tc, ev.peso_nascimento || null, ev.peso_nascimento || null, ev.observacoes || null);
          id = r.lastInsertRowid;
          break;
        }
        case 'pesagem': {
          const bezerro_id = findBezerro(ev.animal_ref);
          if (!bezerro_id) throw new Error('Bezerro não encontrado: ' + ev.animal_ref);
          if (!ev.data) throw new Error('Pesagem sem data');
          if (!ev.peso) throw new Error('Pesagem sem peso');
          const r = db.prepare('INSERT INTO pesagens (bezerro_id, data, peso, observacoes) VALUES (?, ?, ?, ?)')
            .run(bezerro_id, ev.data, ev.peso, ev.observacoes || null);
          db.prepare('UPDATE bezerros SET peso_atual = ? WHERE id = ?').run(ev.peso, bezerro_id);
          id = r.lastInsertRowid;
          break;
        }
        case 'sanitario': {
          const at = ev.animal_tipo || 'matriz';
          const animal_id = findAnimal(at, ev.animal_ref);
          if (!animal_id) throw new Error('Animal não encontrado: ' + ev.animal_ref);
          if (!ev.sanitario_tipo) throw new Error('Sanitário sem tipo');
          if (!ev.nome) throw new Error('Sanitário sem nome do produto');
          if (!ev.data) throw new Error('Sanitário sem data');
          const r = db.prepare('INSERT INTO sanitario (animal_tipo, animal_id, tipo, nome, data, proxima_data, dose, veterinario, custo, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .run(at, animal_id, ev.sanitario_tipo, ev.nome, ev.data, ev.proxima_data || null, ev.dose || null, ev.veterinario || null, ev.custo || null, ev.observacoes || null);
          id = r.lastInsertRowid;
          break;
        }
        case 'alimentacao': {
          const bezerro_id = findBezerro(ev.animal_ref);
          if (!bezerro_id) throw new Error('Bezerro não encontrado: ' + ev.animal_ref);
          if (!ev.alimentacao_tipo) throw new Error('Alimentação sem tipo');
          if (!ev.data) throw new Error('Alimentação sem data');
          const r = db.prepare('INSERT INTO alimentacao (bezerro_id, tipo, sal_nome, sal_marca, sal_preco, data_inicio, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .run(bezerro_id, ev.alimentacao_tipo, ev.sal_nome || null, ev.sal_marca || null, ev.sal_preco || null, ev.data, ev.observacoes || null);
          id = r.lastInsertRowid;
          break;
        }
        case 'financeiro': {
          if (!ev.financeiro_tipo) throw new Error('Financeiro sem tipo');
          if (!ev.categoria) throw new Error('Financeiro sem categoria');
          if (!ev.valor) throw new Error('Financeiro sem valor');
          if (!ev.data) throw new Error('Financeiro sem data');
          const r = db.prepare('INSERT INTO financeiro (tipo, categoria, descricao, valor, data, observacoes) VALUES (?, ?, ?, ?, ?, ?)')
            .run(ev.financeiro_tipo, ev.categoria, ev.descricao || null, ev.valor, ev.data, ev.observacoes || null);
          id = r.lastInsertRowid;
          break;
        }
        case 'outro':
          // Não grava, só ignora
          continue;
        default:
          throw new Error('Tipo desconhecido: ' + ev.tipo);
      }
      gravados.push({ tipo: ev.tipo, id, texto_original: ev.texto_original });
    } catch (err) {
      erros.push({ tipo: ev.tipo, texto_original: ev.texto_original, error: err.message });
    }
  }

  res.json({ gravados: gravados.length, erros, detalhes: gravados });
});

module.exports = router;

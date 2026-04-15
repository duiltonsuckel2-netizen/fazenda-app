const express = require('express');
const router = express.Router();
const db = require('../database');

// === PIQUETES ===

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM piquetes ORDER BY nome').all();
  // Contar animais alocados em cada piquete
  const enriched = rows.map(p => {
    const animais = db.prepare('SELECT COUNT(*) as c FROM alocacoes WHERE piquete_id = ? AND data_saida IS NULL').get(p.id).c;
    return { ...p, animais_alocados: animais };
  });
  res.json(enriched);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM piquetes WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Não encontrado' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { nome, area_hectares, tipo_pastagem, capacidade_ua, observacoes } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });
  try {
    const result = db.prepare(
      'INSERT INTO piquetes (nome, area_hectares, tipo_pastagem, capacidade_ua, observacoes) VALUES (?,?,?,?,?)'
    ).run(nome, area_hectares || null, tipo_pastagem || null, capacidade_ua || null, observacoes || null);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Nome já existe' });
    throw err;
  }
});

router.put('/:id', (req, res) => {
  const { nome, area_hectares, tipo_pastagem, capacidade_ua, status, observacoes } = req.body;
  const result = db.prepare(
    'UPDATE piquetes SET nome=?, area_hectares=?, tipo_pastagem=?, capacidade_ua=?, status=?, observacoes=? WHERE id=?'
  ).run(nome, area_hectares || null, tipo_pastagem || null, capacidade_ua || null, status || 'ativo', observacoes || null, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrado' });
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM piquetes WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrado' });
  res.json({ success: true });
});

// === ALOCAÇÕES ===

// Listar alocações de um piquete
router.get('/:id/alocacoes', (req, res) => {
  const rows = db.prepare('SELECT * FROM alocacoes WHERE piquete_id = ? ORDER BY data_entrada DESC').all(req.params.id);
  const enriched = rows.map(a => {
    let animal;
    if (a.animal_tipo === 'matriz') animal = db.prepare('SELECT numero, nome FROM matrizes WHERE id = ?').get(a.animal_id);
    else if (a.animal_tipo === 'bezerro') animal = db.prepare('SELECT numero, NULL as nome FROM bezerros WHERE id = ?').get(a.animal_id);
    else if (a.animal_tipo === 'touro') animal = db.prepare('SELECT numero, nome FROM touros WHERE id = ?').get(a.animal_id);
    return { ...a, animal_numero: animal?.numero || '?', animal_nome: animal?.nome || null };
  });
  res.json(enriched);
});

// Criar alocação
router.post('/:id/alocacoes', (req, res) => {
  const { animal_tipo, animal_id, data_entrada, observacoes } = req.body;
  if (!animal_tipo || !animal_id || !data_entrada) {
    return res.status(400).json({ error: 'Animal e data de entrada são obrigatórios' });
  }
  const result = db.prepare(
    'INSERT INTO alocacoes (piquete_id, animal_tipo, animal_id, data_entrada, observacoes) VALUES (?,?,?,?,?)'
  ).run(req.params.id, animal_tipo, animal_id, data_entrada, observacoes || null);
  res.status(201).json({ id: result.lastInsertRowid });
});

// Encerrar alocação (saída)
router.patch('/alocacoes/:alocId/saida', (req, res) => {
  const { data_saida } = req.body;
  const result = db.prepare('UPDATE alocacoes SET data_saida = ? WHERE id = ?').run(
    data_saida || new Date().toISOString().split('T')[0], req.params.alocId
  );
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrada' });
  res.json({ success: true });
});

// Deletar alocação
router.delete('/alocacoes/:alocId', (req, res) => {
  const result = db.prepare('DELETE FROM alocacoes WHERE id = ?').run(req.params.alocId);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrada' });
  res.json({ success: true });
});

module.exports = router;

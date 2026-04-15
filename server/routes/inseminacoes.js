const express = require('express');
const router = express.Router();
const db = require('../database');

// Listar todas
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT i.*, m.numero as matriz_numero, m.nome as matriz_nome
    FROM inseminacoes i
    JOIN matrizes m ON m.id = i.matriz_id
    ORDER BY i.data DESC
  `).all();
  res.json(rows);
});

// Buscar uma
router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT i.*, m.numero as matriz_numero, m.nome as matriz_nome
    FROM inseminacoes i
    JOIN matrizes m ON m.id = i.matriz_id
    WHERE i.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Inseminação não encontrada' });
  res.json(row);
});

// Criar
router.post('/', (req, res) => {
  const { matriz_id, data, tipo, touro_semen, observacoes } = req.body;
  if (!matriz_id || !data || !tipo) {
    return res.status(400).json({ error: 'Matriz, data e tipo são obrigatórios' });
  }
  const result = db.prepare(
    'INSERT INTO inseminacoes (matriz_id, data, tipo, touro_semen, observacoes) VALUES (?, ?, ?, ?, ?)'
  ).run(matriz_id, data, tipo, touro_semen || null, observacoes || null);
  res.status(201).json({ id: result.lastInsertRowid });
});

// Atualizar
router.put('/:id', (req, res) => {
  const { matriz_id, data, tipo, touro_semen, resultado, data_resultado, observacoes } = req.body;
  const result = db.prepare(
    'UPDATE inseminacoes SET matriz_id=?, data=?, tipo=?, touro_semen=?, resultado=?, data_resultado=?, observacoes=? WHERE id=?'
  ).run(matriz_id, data, tipo, touro_semen || null, resultado || 'pendente', data_resultado || null, observacoes || null, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrada' });
  res.json({ success: true });
});

// Deletar
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM inseminacoes WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrada' });
  res.json({ success: true });
});

module.exports = router;

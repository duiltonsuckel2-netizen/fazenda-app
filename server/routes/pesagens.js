const express = require('express');
const router = express.Router();
const db = require('../database');

// Listar todas
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, b.numero as bezerro_numero
    FROM pesagens p
    JOIN bezerros b ON b.id = p.bezerro_id
    ORDER BY p.data DESC
  `).all();
  res.json(rows);
});

// Criar
router.post('/', (req, res) => {
  const { bezerro_id, data, peso, observacoes } = req.body;
  if (!bezerro_id || !data || !peso) {
    return res.status(400).json({ error: 'Bezerro, data e peso são obrigatórios' });
  }
  const result = db.prepare(
    'INSERT INTO pesagens (bezerro_id, data, peso, observacoes) VALUES (?, ?, ?, ?)'
  ).run(bezerro_id, data, peso, observacoes || null);

  // Atualizar peso atual do bezerro
  db.prepare('UPDATE bezerros SET peso_atual = ? WHERE id = ?').run(peso, bezerro_id);

  res.status(201).json({ id: result.lastInsertRowid });
});

// Deletar
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM pesagens WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrada' });
  res.json({ success: true });
});

module.exports = router;

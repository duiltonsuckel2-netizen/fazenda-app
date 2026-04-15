const express = require('express');
const router = express.Router();
const db = require('../database');

// Listar
router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM touros';
  const params = [];
  if (status) { sql += ' WHERE status = ?'; params.push(status); }
  sql += ' ORDER BY numero';
  res.json(db.prepare(sql).all(...params));
});

// Buscar por ID
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM touros WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Não encontrado' });
  res.json(row);
});

// Criar
router.post('/', (req, res) => {
  const { numero, nome, raca, data_nascimento, origem, observacoes } = req.body;
  if (!numero) return res.status(400).json({ error: 'Número é obrigatório' });
  try {
    const result = db.prepare(
      'INSERT INTO touros (numero, nome, raca, data_nascimento, origem, observacoes) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(numero, nome || null, raca || null, data_nascimento || null, origem || null, observacoes || null);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Número já existe' });
    throw err;
  }
});

// Atualizar
router.put('/:id', (req, res) => {
  const { numero, nome, raca, data_nascimento, origem, status, observacoes } = req.body;
  const result = db.prepare(
    'UPDATE touros SET numero=?, nome=?, raca=?, data_nascimento=?, origem=?, status=?, observacoes=? WHERE id=?'
  ).run(numero, nome || null, raca || null, data_nascimento || null, origem || null, status || 'ativo', observacoes || null, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrado' });
  res.json({ success: true });
});

// Deletar
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM touros WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrado' });
  res.json({ success: true });
});

// Bezerros do touro (via inseminações)
router.get('/:id/bezerros', (req, res) => {
  const touro = db.prepare('SELECT * FROM touros WHERE id = ?').get(req.params.id);
  if (!touro) return res.status(404).json({ error: 'Não encontrado' });
  const rows = db.prepare(`
    SELECT b.*, m.numero as matriz_numero, m.nome as matriz_nome
    FROM bezerros b
    JOIN matrizes m ON m.id = b.matriz_id
    JOIN inseminacoes i ON i.id = b.inseminacao_id
    WHERE i.touro_semen = ?
    ORDER BY b.data_nascimento DESC
  `).all(touro.nome || touro.numero);
  res.json(rows);
});

module.exports = router;

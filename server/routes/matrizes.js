const express = require('express');
const router = express.Router();
const db = require('../database');

// Listar todas
router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM matrizes';
  const params = [];
  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY numero';
  res.json(db.prepare(sql).all(...params));
});

// Buscar uma
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM matrizes WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Matriz não encontrada' });
  res.json(row);
});

// Criar
router.post('/', (req, res) => {
  const { numero, nome, data_nascimento, raca, observacoes } = req.body;
  if (!numero) return res.status(400).json({ error: 'Número é obrigatório' });
  try {
    const result = db.prepare(
      'INSERT INTO matrizes (numero, nome, data_nascimento, raca, observacoes) VALUES (?, ?, ?, ?, ?)'
    ).run(numero, nome || null, data_nascimento || null, raca || null, observacoes || null);
    res.status(201).json({ id: result.lastInsertRowid, numero });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Número já cadastrado' });
    throw e;
  }
});

// Atualizar
router.put('/:id', (req, res) => {
  const { numero, nome, data_nascimento, raca, status, observacoes } = req.body;
  const result = db.prepare(
    'UPDATE matrizes SET numero=?, nome=?, data_nascimento=?, raca=?, status=?, observacoes=? WHERE id=?'
  ).run(numero, nome || null, data_nascimento || null, raca || null, status || 'ativa', observacoes || null, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrada' });
  res.json({ success: true });
});

// Deletar
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM matrizes WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrada' });
  res.json({ success: true });
});

// Histórico de inseminações de uma matriz
router.get('/:id/inseminacoes', (req, res) => {
  const rows = db.prepare('SELECT * FROM inseminacoes WHERE matriz_id = ? ORDER BY data DESC').all(req.params.id);
  res.json(rows);
});

// Bezerros de uma matriz
router.get('/:id/bezerros', (req, res) => {
  const rows = db.prepare('SELECT * FROM bezerros WHERE matriz_id = ? ORDER BY data_nascimento DESC').all(req.params.id);
  res.json(rows);
});

module.exports = router;

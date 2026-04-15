const express = require('express');
const router = express.Router();
const db = require('../database');

// Listar todas
router.get('/', (req, res) => {
  const { bezerro_id } = req.query;
  let sql = `
    SELECT a.*, b.numero as bezerro_numero
    FROM alimentacao a
    JOIN bezerros b ON b.id = a.bezerro_id
  `;
  const params = [];
  if (bezerro_id) { sql += ' WHERE a.bezerro_id = ?'; params.push(bezerro_id); }
  sql += ' ORDER BY a.data_inicio DESC';
  res.json(db.prepare(sql).all(...params));
});

// Criar
router.post('/', (req, res) => {
  const { bezerro_id, tipo, sal_nome, sal_marca, sal_preco, data_inicio, data_fim, observacoes } = req.body;
  if (!bezerro_id || !tipo || !data_inicio) {
    return res.status(400).json({ error: 'Bezerro, tipo e data de início são obrigatórios' });
  }
  const result = db.prepare(
    `INSERT INTO alimentacao (bezerro_id, tipo, sal_nome, sal_marca, sal_preco, data_inicio, data_fim, observacoes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(bezerro_id, tipo, sal_nome || null, sal_marca || null, sal_preco || null, data_inicio, data_fim || null, observacoes || null);
  res.status(201).json({ id: result.lastInsertRowid });
});

// Atualizar
router.put('/:id', (req, res) => {
  const { bezerro_id, tipo, sal_nome, sal_marca, sal_preco, data_inicio, data_fim, observacoes } = req.body;
  const result = db.prepare(
    `UPDATE alimentacao SET bezerro_id=?, tipo=?, sal_nome=?, sal_marca=?, sal_preco=?, data_inicio=?, data_fim=?, observacoes=? WHERE id=?`
  ).run(bezerro_id, tipo, sal_nome || null, sal_marca || null, sal_preco || null, data_inicio, data_fim || null, observacoes || null, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrado' });
  res.json({ success: true });
});

// Deletar
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM alimentacao WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrado' });
  res.json({ success: true });
});

// Resumo de gastos
router.get('/resumo', (req, res) => {
  const totalSal = db.prepare(`SELECT COALESCE(SUM(sal_preco), 0) as total FROM alimentacao WHERE tipo = 'sal'`).get().total;
  const qtdSal = db.prepare(`SELECT COUNT(*) as c FROM alimentacao WHERE tipo = 'sal'`).get().c;
  const qtdRacao = db.prepare(`SELECT COUNT(*) as c FROM alimentacao WHERE tipo = 'racao'`).get().c;
  res.json({ totalSal, qtdSal, qtdRacao });
});

module.exports = router;

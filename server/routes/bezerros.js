const express = require('express');
const router = express.Router();
const db = require('../database');

// Listar todos
router.get('/', (req, res) => {
  const { destino, sexo } = req.query;
  let sql = `
    SELECT b.*, m.numero as matriz_numero, m.nome as matriz_nome
    FROM bezerros b
    JOIN matrizes m ON m.id = b.matriz_id
  `;
  const conditions = [];
  const params = [];
  if (destino) { conditions.push('b.destino = ?'); params.push(destino); }
  if (sexo) { conditions.push('b.sexo = ?'); params.push(sexo); }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY b.data_nascimento DESC';
  res.json(db.prepare(sql).all(...params));
});

// Buscar um
router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT b.*, m.numero as matriz_numero, m.nome as matriz_nome
    FROM bezerros b
    JOIN matrizes m ON m.id = b.matriz_id
    WHERE b.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Bezerro não encontrado' });
  res.json(row);
});

// Criar
router.post('/', (req, res) => {
  const { numero, matriz_id, inseminacao_id, data_nascimento, sexo, tipo_concepcao, peso_nascimento, observacoes } = req.body;
  if (!numero || !matriz_id || !data_nascimento || !sexo || !tipo_concepcao) {
    return res.status(400).json({ error: 'Número, matriz, data de nascimento, sexo e tipo de concepção são obrigatórios' });
  }
  try {
    const result = db.prepare(
      `INSERT INTO bezerros (numero, matriz_id, inseminacao_id, data_nascimento, sexo, tipo_concepcao, peso_nascimento, peso_atual, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(numero, matriz_id, inseminacao_id || null, data_nascimento, sexo, tipo_concepcao, peso_nascimento || null, peso_nascimento || null, observacoes || null);
    res.status(201).json({ id: result.lastInsertRowid, numero });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Número já cadastrado' });
    throw e;
  }
});

// Atualizar
router.put('/:id', (req, res) => {
  const { numero, matriz_id, inseminacao_id, data_nascimento, sexo, tipo_concepcao,
          peso_nascimento, peso_desmame, peso_atual, destino, data_destino,
          valor_venda, comprador, observacoes } = req.body;
  const result = db.prepare(
    `UPDATE bezerros SET numero=?, matriz_id=?, inseminacao_id=?, data_nascimento=?, sexo=?, tipo_concepcao=?,
     peso_nascimento=?, peso_desmame=?, peso_atual=?, destino=?, data_destino=?,
     valor_venda=?, comprador=?, observacoes=? WHERE id=?`
  ).run(numero, matriz_id, inseminacao_id || null, data_nascimento, sexo, tipo_concepcao,
        peso_nascimento || null, peso_desmame || null, peso_atual || null,
        destino || 'na_fazenda', data_destino || null,
        valor_venda || null, comprador || null, observacoes || null, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrado' });
  res.json({ success: true });
});

// Atualizar destino (ação rápida)
router.patch('/:id/destino', (req, res) => {
  const { destino, data_destino, valor_venda, comprador } = req.body;
  if (!destino) return res.status(400).json({ error: 'Destino é obrigatório' });
  const result = db.prepare(
    'UPDATE bezerros SET destino=?, data_destino=?, valor_venda=?, comprador=? WHERE id=?'
  ).run(destino, data_destino || null, valor_venda || null, comprador || null, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrado' });
  res.json({ success: true });
});

// Deletar
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM bezerros WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrado' });
  res.json({ success: true });
});

// Pesagens de um bezerro
router.get('/:id/pesagens', (req, res) => {
  const rows = db.prepare('SELECT * FROM pesagens WHERE bezerro_id = ? ORDER BY data DESC').all(req.params.id);
  res.json(rows);
});

module.exports = router;

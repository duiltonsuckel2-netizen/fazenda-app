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
  const pesagem = db.prepare('SELECT * FROM pesagens WHERE id = ?').get(req.params.id);
  if (!pesagem) return res.status(404).json({ error: 'Não encontrada' });

  db.prepare('DELETE FROM pesagens WHERE id = ?').run(req.params.id);

  // Reverter peso_atual para a pesagem mais recente restante (ou peso_nascimento)
  const ultima = db.prepare('SELECT peso FROM pesagens WHERE bezerro_id = ? ORDER BY data DESC, id DESC LIMIT 1').get(pesagem.bezerro_id);
  if (ultima) {
    db.prepare('UPDATE bezerros SET peso_atual = ? WHERE id = ?').run(ultima.peso, pesagem.bezerro_id);
  } else {
    db.prepare('UPDATE bezerros SET peso_atual = peso_nascimento WHERE id = ?').run(pesagem.bezerro_id);
  }

  res.json({ success: true });
});

module.exports = router;

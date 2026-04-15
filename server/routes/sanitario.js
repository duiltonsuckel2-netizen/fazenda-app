const express = require('express');
const router = express.Router();
const db = require('../database');

function getAnimalInfo(tipo, id) {
  if (tipo === 'matriz') return db.prepare('SELECT numero, nome FROM matrizes WHERE id = ?').get(id);
  if (tipo === 'bezerro') return db.prepare('SELECT numero, NULL as nome FROM bezerros WHERE id = ?').get(id);
  if (tipo === 'touro') return db.prepare('SELECT numero, nome FROM touros WHERE id = ?').get(id);
  return null;
}

// Listar
router.get('/', (req, res) => {
  const { animal_tipo, animal_id, tipo } = req.query;
  let sql = 'SELECT * FROM sanitario WHERE 1=1';
  const params = [];
  if (animal_tipo) { sql += ' AND animal_tipo = ?'; params.push(animal_tipo); }
  if (animal_id) { sql += ' AND animal_id = ?'; params.push(animal_id); }
  if (tipo) { sql += ' AND tipo = ?'; params.push(tipo); }
  sql += ' ORDER BY data DESC';
  const rows = db.prepare(sql).all(...params);

  // Enriquecer com info do animal
  const enriched = rows.map(r => {
    const animal = getAnimalInfo(r.animal_tipo, r.animal_id);
    return { ...r, animal_numero: animal?.numero || '?', animal_nome: animal?.nome || null };
  });
  res.json(enriched);
});

// Próximos vencimentos
router.get('/vencimentos', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM sanitario
    WHERE proxima_data IS NOT NULL AND proxima_data >= date('now','localtime')
    ORDER BY proxima_data ASC LIMIT 20
  `).all();
  const enriched = rows.map(r => {
    const animal = getAnimalInfo(r.animal_tipo, r.animal_id);
    return { ...r, animal_numero: animal?.numero || '?', animal_nome: animal?.nome || null };
  });
  res.json(enriched);
});

// Criar
router.post('/', (req, res) => {
  const { animal_tipo, animal_id, tipo, nome, data, proxima_data, dose, carencia_dias, veterinario, custo, observacoes } = req.body;
  if (!animal_tipo || !animal_id || !tipo || !nome || !data) {
    return res.status(400).json({ error: 'Animal, tipo, nome e data são obrigatórios' });
  }
  const result = db.prepare(
    'INSERT INTO sanitario (animal_tipo, animal_id, tipo, nome, data, proxima_data, dose, carencia_dias, veterinario, custo, observacoes) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  ).run(animal_tipo, animal_id, tipo, nome, data, proxima_data || null, dose || null, carencia_dias || null, veterinario || null, custo || null, observacoes || null);
  res.status(201).json({ id: result.lastInsertRowid });
});

// Atualizar
router.put('/:id', (req, res) => {
  const { animal_tipo, animal_id, tipo, nome, data, proxima_data, dose, carencia_dias, veterinario, custo, observacoes } = req.body;
  const result = db.prepare(
    'UPDATE sanitario SET animal_tipo=?, animal_id=?, tipo=?, nome=?, data=?, proxima_data=?, dose=?, carencia_dias=?, veterinario=?, custo=?, observacoes=? WHERE id=?'
  ).run(animal_tipo, animal_id, tipo, nome, data, proxima_data || null, dose || null, carencia_dias || null, veterinario || null, custo || null, observacoes || null, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrado' });
  res.json({ success: true });
});

// Deletar
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM sanitario WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrado' });
  res.json({ success: true });
});

module.exports = router;

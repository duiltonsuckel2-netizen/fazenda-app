const express = require('express');
const router = express.Router();
const db = require('../database');

// Listar
router.get('/', (req, res) => {
  const { tipo, categoria, mes } = req.query;
  let sql = 'SELECT * FROM financeiro WHERE 1=1';
  const params = [];
  if (tipo) { sql += ' AND tipo = ?'; params.push(tipo); }
  if (categoria) { sql += ' AND categoria = ?'; params.push(categoria); }
  if (mes) { sql += " AND strftime('%Y-%m', data) = ?"; params.push(mes); }
  sql += ' ORDER BY data DESC';
  res.json(db.prepare(sql).all(...params));
});

// Resumo
router.get('/resumo', (req, res) => {
  const totalReceitas = db.prepare("SELECT COALESCE(SUM(valor),0) as v FROM financeiro WHERE tipo='receita'").get().v;
  const totalDespesas = db.prepare("SELECT COALESCE(SUM(valor),0) as v FROM financeiro WHERE tipo='despesa'").get().v;

  // Por categoria
  const porCategoria = db.prepare(`
    SELECT categoria, tipo, SUM(valor) as total, COUNT(*) as qtd
    FROM financeiro GROUP BY categoria, tipo ORDER BY total DESC
  `).all();

  // Últimos 6 meses
  const mensal = db.prepare(`
    SELECT strftime('%Y-%m', data) as mes,
      SUM(CASE WHEN tipo='receita' THEN valor ELSE 0 END) as receitas,
      SUM(CASE WHEN tipo='despesa' THEN valor ELSE 0 END) as despesas
    FROM financeiro
    WHERE data >= date('now','-6 months','localtime')
    GROUP BY mes ORDER BY mes
  `).all();

  // Custo sanitário total
  const custoSanitario = db.prepare("SELECT COALESCE(SUM(custo),0) as v FROM sanitario WHERE custo IS NOT NULL").get().v;

  // Custo alimentação (sal)
  const custoAlimentacao = db.prepare("SELECT COALESCE(SUM(sal_preco),0) as v FROM alimentacao WHERE sal_preco IS NOT NULL").get().v;

  res.json({ totalReceitas, totalDespesas, saldo: totalReceitas - totalDespesas, porCategoria, mensal, custoSanitario, custoAlimentacao });
});

// Criar
router.post('/', (req, res) => {
  const { tipo, categoria, descricao, valor, data, animal_tipo, animal_id, observacoes } = req.body;
  if (!tipo || !categoria || !valor || !data) {
    return res.status(400).json({ error: 'Tipo, categoria, valor e data são obrigatórios' });
  }
  const result = db.prepare(
    'INSERT INTO financeiro (tipo, categoria, descricao, valor, data, animal_tipo, animal_id, observacoes) VALUES (?,?,?,?,?,?,?,?)'
  ).run(tipo, categoria, descricao || null, valor, data, animal_tipo || null, animal_id || null, observacoes || null);
  res.status(201).json({ id: result.lastInsertRowid });
});

// Atualizar
router.put('/:id', (req, res) => {
  const { tipo, categoria, descricao, valor, data, animal_tipo, animal_id, observacoes } = req.body;
  const result = db.prepare(
    'UPDATE financeiro SET tipo=?, categoria=?, descricao=?, valor=?, data=?, animal_tipo=?, animal_id=?, observacoes=? WHERE id=?'
  ).run(tipo, categoria, descricao || null, valor, data, animal_tipo || null, animal_id || null, observacoes || null, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrado' });
  res.json({ success: true });
});

// Deletar
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM financeiro WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Não encontrado' });
  res.json({ success: true });
});

module.exports = router;

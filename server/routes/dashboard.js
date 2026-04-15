const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const stats = {};

  // Matrizes
  stats.totalMatrizes = db.prepare(`SELECT COUNT(*) as c FROM matrizes WHERE status = 'ativa'`).get().c;
  stats.matrizesPrenas = db.prepare(`
    SELECT COUNT(DISTINCT i.matriz_id) as c FROM inseminacoes i
    WHERE i.resultado = 'prenha'
    AND i.matriz_id NOT IN (
      SELECT DISTINCT b.matriz_id FROM bezerros b
      WHERE b.inseminacao_id = i.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM inseminacoes i2
      WHERE i2.matriz_id = i.matriz_id AND i2.id > i.id
    )
  `).get().c;

  // Inseminações
  stats.totalInseminacoes = db.prepare('SELECT COUNT(*) as c FROM inseminacoes').get().c;
  stats.inseminacoesIA = db.prepare(`SELECT COUNT(*) as c FROM inseminacoes WHERE tipo = 'IA'`).get().c;
  stats.inseminacoesMN = db.prepare(`SELECT COUNT(*) as c FROM inseminacoes WHERE tipo = 'MN'`).get().c;
  stats.taxaSucesso = db.prepare(`
    SELECT ROUND(CAST(SUM(CASE WHEN resultado = 'prenha' THEN 1 ELSE 0 END) AS FLOAT) /
    NULLIF(COUNT(CASE WHEN resultado != 'pendente' THEN 1 END), 0) * 100, 1) as taxa
    FROM inseminacoes
  `).get().taxa || 0;

  // Bezerros
  stats.totalBezerros = db.prepare('SELECT COUNT(*) as c FROM bezerros').get().c;
  stats.bezerrosNaFazenda = db.prepare(`SELECT COUNT(*) as c FROM bezerros WHERE destino = 'na_fazenda'`).get().c;
  stats.bezerrosVendidos = db.prepare(`SELECT COUNT(*) as c FROM bezerros WHERE destino = 'vendido_desmame'`).get().c;
  stats.bezerrosEscalada = db.prepare(`SELECT COUNT(*) as c FROM bezerros WHERE destino = 'escalada'`).get().c;
  stats.bezerrosFrigorifico = db.prepare(`SELECT COUNT(*) as c FROM bezerros WHERE destino = 'frigorifico'`).get().c;
  stats.bezerrosIpe = db.prepare(`SELECT COUNT(*) as c FROM bezerros WHERE destino = 'ipe'`).get().c;
  stats.bezerrosMachos = db.prepare(`SELECT COUNT(*) as c FROM bezerros WHERE sexo = 'M'`).get().c;
  stats.bezerrosFemeas = db.prepare(`SELECT COUNT(*) as c FROM bezerros WHERE sexo = 'F'`).get().c;

  // Valor total de vendas
  stats.valorTotalVendas = db.prepare('SELECT COALESCE(SUM(valor_venda), 0) as total FROM bezerros WHERE valor_venda IS NOT NULL').get().total;

  // Peso médio por sexo ao sair
  const pesoSaidaMachos = db.prepare(`SELECT ROUND(AVG(peso_atual),1) as v FROM bezerros WHERE sexo='M' AND destino != 'na_fazenda' AND peso_atual IS NOT NULL`).get().v;
  const pesoSaidaFemeas = db.prepare(`SELECT ROUND(AVG(peso_atual),1) as v FROM bezerros WHERE sexo='F' AND destino != 'na_fazenda' AND peso_atual IS NOT NULL`).get().v;
  stats.pesoSaidaMachos = pesoSaidaMachos;
  stats.pesoSaidaFemeas = pesoSaidaFemeas;

  // Touros ativos
  stats.totalTouros = db.prepare("SELECT COUNT(*) as c FROM touros WHERE status = 'ativo'").get().c;

  // Últimos bezerros nascidos
  stats.ultimosNascimentos = db.prepare(`
    SELECT b.*, m.numero as matriz_numero, m.nome as matriz_nome
    FROM bezerros b
    JOIN matrizes m ON m.id = b.matriz_id
    ORDER BY b.data_nascimento DESC LIMIT 5
  `).all();

  // Inseminações pendentes
  stats.inseminacoesPendentes = db.prepare(`
    SELECT i.*, m.numero as matriz_numero, m.nome as matriz_nome
    FROM inseminacoes i
    JOIN matrizes m ON m.id = i.matriz_id
    WHERE i.resultado = 'pendente'
    ORDER BY i.data DESC
  `).all();

  res.json(stats);
});

module.exports = router;

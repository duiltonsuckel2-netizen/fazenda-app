const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const relatorio = {};

  // === KPIs REPRODUTIVOS ===
  const totalExpostas = db.prepare('SELECT COUNT(DISTINCT matriz_id) as c FROM inseminacoes').get().c;
  const totalPrenhas = db.prepare("SELECT COUNT(DISTINCT matriz_id) as c FROM inseminacoes WHERE resultado='prenha'").get().c;
  const totalVazias = db.prepare("SELECT COUNT(DISTINCT matriz_id) as c FROM inseminacoes WHERE resultado='vazia'").get().c;
  const totalNascidos = db.prepare('SELECT COUNT(*) as c FROM bezerros').get().c;
  const totalDesmamados = db.prepare("SELECT COUNT(*) as c FROM bezerros WHERE destino != 'na_fazenda'").get().c;

  relatorio.reprodutivo = {
    taxaPrenhez: totalExpostas > 0 ? Math.round((totalPrenhas / totalExpostas) * 100) : 0,
    taxaNatalidade: totalPrenhas > 0 ? Math.round((totalNascidos / totalPrenhas) * 100) : 0,
    taxaDesmame: totalNascidos > 0 ? Math.round((totalDesmamados / totalNascidos) * 100) : 0,
    totalExpostas,
    totalPrenhas,
    totalVazias,
    totalNascidos,
    totalDesmamados,
  };

  // Taxa de sucesso por touro
  relatorio.porTouro = db.prepare(`
    SELECT touro_semen as touro,
      COUNT(*) as total,
      SUM(CASE WHEN resultado='prenha' THEN 1 ELSE 0 END) as prenhas,
      ROUND(CAST(SUM(CASE WHEN resultado='prenha' THEN 1 ELSE 0 END) AS FLOAT) /
        NULLIF(COUNT(CASE WHEN resultado != 'pendente' THEN 1 END), 0) * 100, 1) as taxa
    FROM inseminacoes
    WHERE touro_semen IS NOT NULL AND touro_semen != ''
    GROUP BY touro_semen ORDER BY taxa DESC
  `).all();

  // === GMD POR BEZERRO ===
  const bezerros = db.prepare(`
    SELECT b.id, b.numero, b.peso_nascimento, b.peso_atual, b.data_nascimento,
      m.numero as matriz_numero
    FROM bezerros b
    JOIN matrizes m ON m.id = b.matriz_id
    WHERE b.destino = 'na_fazenda'
    ORDER BY b.numero
  `).all();

  relatorio.gmd = bezerros.map(b => {
    const pesagens = db.prepare('SELECT data, peso FROM pesagens WHERE bezerro_id = ? ORDER BY data ASC').all(b.id);

    let gmd = null;
    if (pesagens.length >= 2) {
      const primeira = pesagens[0];
      const ultima = pesagens[pesagens.length - 1];
      const dias = Math.max(1, Math.round((new Date(ultima.data) - new Date(primeira.data)) / 86400000));
      gmd = ((ultima.peso - primeira.peso) / dias).toFixed(3);
    } else if (pesagens.length === 1 && b.peso_nascimento) {
      const dias = Math.max(1, Math.round((new Date(pesagens[0].data) - new Date(b.data_nascimento)) / 86400000));
      gmd = ((pesagens[0].peso - b.peso_nascimento) / dias).toFixed(3);
    }

    return {
      id: b.id,
      numero: b.numero,
      matriz_numero: b.matriz_numero,
      peso_nascimento: b.peso_nascimento,
      peso_atual: b.peso_atual,
      gmd: gmd ? Number(gmd) : null,
      pesagens: pesagens.length,
    };
  });

  // === CURVA DE CRESCIMENTO (dados pra gráfico) ===
  relatorio.curvasCrescimento = bezerros.slice(0, 10).map(b => {
    const pontos = [];
    if (b.peso_nascimento) {
      pontos.push({ data: b.data_nascimento, peso: b.peso_nascimento, diasVida: 0 });
    }
    const pesagens = db.prepare('SELECT data, peso FROM pesagens WHERE bezerro_id = ? ORDER BY data ASC').all(b.id);
    pesagens.forEach(p => {
      const dias = Math.round((new Date(p.data) - new Date(b.data_nascimento)) / 86400000);
      pontos.push({ data: p.data, peso: p.peso, diasVida: dias });
    });
    return { id: b.id, numero: b.numero, pontos };
  });

  // === MORTALIDADE ===
  const matrizesmortas = db.prepare("SELECT COUNT(*) as c FROM matrizes WHERE status = 'morta'").get().c;
  const totalMatrizes = db.prepare('SELECT COUNT(*) as c FROM matrizes').get().c;
  relatorio.mortalidade = {
    matrizesMortas: matrizesmortas,
    totalMatrizes,
    taxa: totalMatrizes > 0 ? Math.round((matrizesmortas / totalMatrizes) * 100 * 10) / 10 : 0,
  };

  // === FINANCEIRO RESUMIDO ===
  relatorio.financeiro = {
    receitas: db.prepare("SELECT COALESCE(SUM(valor),0) as v FROM financeiro WHERE tipo='receita'").get().v,
    despesas: db.prepare("SELECT COALESCE(SUM(valor),0) as v FROM financeiro WHERE tipo='despesa'").get().v,
    vendas: db.prepare("SELECT COALESCE(SUM(valor_venda),0) as v FROM bezerros WHERE valor_venda IS NOT NULL").get().v,
    custoSanitario: db.prepare("SELECT COALESCE(SUM(custo),0) as v FROM sanitario WHERE custo IS NOT NULL").get().v,
    custoAlimentacao: db.prepare("SELECT COALESCE(SUM(sal_preco),0) as v FROM alimentacao WHERE sal_preco IS NOT NULL").get().v,
  };

  // === PESO MÉDIO AO DESMAME ===
  relatorio.pesoMedioDesmame = db.prepare("SELECT ROUND(AVG(peso_desmame),1) as v FROM bezerros WHERE peso_desmame IS NOT NULL").get().v;

  // === PESO MÉDIO POR SEXO AO SAIR DA CABLOCA ===
  relatorio.pesoSaidaPorSexo = {
    machos: db.prepare(`
      SELECT ROUND(AVG(peso_atual),1) as pesoMedio, COUNT(*) as qtd
      FROM bezerros WHERE sexo='M' AND destino != 'na_fazenda' AND peso_atual IS NOT NULL
    `).get(),
    femeas: db.prepare(`
      SELECT ROUND(AVG(peso_atual),1) as pesoMedio, COUNT(*) as qtd
      FROM bezerros WHERE sexo='F' AND destino != 'na_fazenda' AND peso_atual IS NOT NULL
    `).get(),
  };

  // === ANIMAIS POR PIQUETE ===
  relatorio.lotacao = db.prepare(`
    SELECT p.nome, p.area_hectares, p.capacidade_ua,
      COUNT(a.id) as animais
    FROM piquetes p
    LEFT JOIN alocacoes a ON a.piquete_id = p.id AND a.data_saida IS NULL
    WHERE p.status = 'ativo'
    GROUP BY p.id ORDER BY p.nome
  `).all();

  res.json(relatorio);
});

// Curva de crescimento individual
router.get('/crescimento/:bezerroId', (req, res) => {
  const b = db.prepare('SELECT * FROM bezerros WHERE id = ?').get(req.params.bezerroId);
  if (!b) return res.status(404).json({ error: 'Bezerro não encontrado' });

  const pontos = [];
  if (b.peso_nascimento) {
    pontos.push({ data: b.data_nascimento, peso: b.peso_nascimento, diasVida: 0 });
  }
  const pesagens = db.prepare('SELECT data, peso FROM pesagens WHERE bezerro_id = ? ORDER BY data ASC').all(b.id);
  pesagens.forEach(p => {
    const dias = Math.round((new Date(p.data) - new Date(b.data_nascimento)) / 86400000);
    pontos.push({ data: p.data, peso: p.peso, diasVida: dias });
  });
  res.json({ numero: b.numero, pontos });
});

module.exports = router;

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Servir frontend em produção
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// Rotas da API
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/matrizes', require('./routes/matrizes'));
app.use('/api/inseminacoes', require('./routes/inseminacoes'));
app.use('/api/bezerros', require('./routes/bezerros'));
app.use('/api/pesagens', require('./routes/pesagens'));
app.use('/api/alimentacao', require('./routes/alimentacao'));
app.use('/api/touros', require('./routes/touros'));
app.use('/api/sanitario', require('./routes/sanitario'));
app.use('/api/piquetes', require('./routes/piquetes'));
app.use('/api/financeiro', require('./routes/financeiro'));
app.use('/api/relatorios', require('./routes/relatorios'));

// Fallback para SPA
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🐄 Servidor rodando em http://localhost:${PORT}`);
});

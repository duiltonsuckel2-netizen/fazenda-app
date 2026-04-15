const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'fazenda.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS matrizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT NOT NULL UNIQUE,
    nome TEXT,
    data_nascimento TEXT,
    raca TEXT,
    status TEXT DEFAULT 'ativa' CHECK(status IN ('ativa','descartada','morta')),
    observacoes TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS inseminacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matriz_id INTEGER NOT NULL,
    data TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('IA','MN')),
    touro_semen TEXT,
    resultado TEXT DEFAULT 'pendente' CHECK(resultado IN ('pendente','prenha','vazia')),
    data_resultado TEXT,
    observacoes TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (matriz_id) REFERENCES matrizes(id)
  );

  CREATE TABLE IF NOT EXISTS bezerros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT NOT NULL UNIQUE,
    matriz_id INTEGER NOT NULL,
    inseminacao_id INTEGER,
    data_nascimento TEXT NOT NULL,
    sexo TEXT NOT NULL CHECK(sexo IN ('M','F')),
    tipo_concepcao TEXT NOT NULL CHECK(tipo_concepcao IN ('IA','MN')),
    peso_nascimento REAL,
    peso_desmame REAL,
    peso_atual REAL,
    destino TEXT DEFAULT 'na_fazenda' CHECK(destino IN ('na_fazenda','vendido_desmame','escalada','frigorifico','ipe')),
    data_destino TEXT,
    valor_venda REAL,
    comprador TEXT,
    observacoes TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (matriz_id) REFERENCES matrizes(id),
    FOREIGN KEY (inseminacao_id) REFERENCES inseminacoes(id)
  );

  CREATE TABLE IF NOT EXISTS alimentacao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bezerro_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('sal','racao')),
    sal_nome TEXT,
    sal_marca TEXT,
    sal_preco REAL,
    data_inicio TEXT NOT NULL,
    data_fim TEXT,
    observacoes TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (bezerro_id) REFERENCES bezerros(id)
  );

  CREATE TABLE IF NOT EXISTS pesagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bezerro_id INTEGER NOT NULL,
    data TEXT NOT NULL,
    peso REAL NOT NULL,
    observacoes TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (bezerro_id) REFERENCES bezerros(id)
  );

  CREATE TABLE IF NOT EXISTS touros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT NOT NULL UNIQUE,
    nome TEXT,
    raca TEXT,
    data_nascimento TEXT,
    origem TEXT,
    status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo','descartado','morto')),
    observacoes TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS sanitario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_tipo TEXT NOT NULL CHECK(animal_tipo IN ('matriz','bezerro','touro')),
    animal_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('vacina','vermifugo','tratamento','exame')),
    nome TEXT NOT NULL,
    data TEXT NOT NULL,
    proxima_data TEXT,
    dose TEXT,
    carencia_dias INTEGER,
    veterinario TEXT,
    custo REAL,
    observacoes TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS piquetes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    area_hectares REAL,
    tipo_pastagem TEXT,
    capacidade_ua REAL,
    status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo','em_descanso','em_reforma')),
    observacoes TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS alocacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    piquete_id INTEGER NOT NULL,
    animal_tipo TEXT NOT NULL CHECK(animal_tipo IN ('matriz','bezerro','touro')),
    animal_id INTEGER NOT NULL,
    data_entrada TEXT NOT NULL,
    data_saida TEXT,
    observacoes TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (piquete_id) REFERENCES piquetes(id)
  );

  CREATE TABLE IF NOT EXISTS financeiro (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL CHECK(tipo IN ('receita','despesa')),
    categoria TEXT NOT NULL,
    descricao TEXT,
    valor REAL NOT NULL,
    data TEXT NOT NULL,
    animal_tipo TEXT,
    animal_id INTEGER,
    observacoes TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );
`);

module.exports = db;

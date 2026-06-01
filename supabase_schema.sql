-- Criar tabela de Casas
CREATE TABLE IF NOT EXISTS casas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  login TEXT,
  senha TEXT,
  meta NUMERIC DEFAULT 0,
  media NUMERIC DEFAULT 0,
  prazo TEXT,
  linkCasa TEXT,
  linkContaFilha TEXT,
  status TEXT DEFAULT 'ativa',
  criadoEm TEXT NOT NULL,
  finalizadoEm TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de Relatórios
CREATE TABLE IF NOT EXISTS relatorios (
  id TEXT PRIMARY KEY,
  casaId TEXT NOT NULL REFERENCES casas(id) ON DELETE CASCADE,
  agente TEXT NOT NULL,
  prazo TEXT,
  cooperacao NUMERIC DEFAULT 0,
  rows JSONB DEFAULT '[]',
  status TEXT DEFAULT 'ativo',
  criadoEm TEXT NOT NULL,
  finalizadoEm TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_relatorios_casaId ON relatorios(casaId);
CREATE INDEX IF NOT EXISTS idx_relatorios_status ON relatorios(status);
CREATE INDEX IF NOT EXISTS idx_casas_status ON casas(status);

-- Habilitar RLS (Row Level Security) se necessário
ALTER TABLE casas ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorios ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso público (ajuste conforme necessário)
CREATE POLICY "Enable read access for all users" ON casas
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON casas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON casas
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON casas
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON relatorios
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON relatorios
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON relatorios
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON relatorios
  FOR DELETE USING (true);

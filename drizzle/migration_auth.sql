-- Migration: Adicionar campos de autenticação própria e controle de assinatura
-- Execute este script no seu banco de dados MySQL (via Fly.io ou PlanetScale)

-- 1. Tornar openId opcional (não mais NOT NULL)
ALTER TABLE users MODIFY COLUMN openId VARCHAR(64) NULL;

-- 2. Adicionar hash de senha
ALTER TABLE users ADD COLUMN IF NOT EXISTS passwordHash TEXT NULL AFTER email;

-- 3. Adicionar status de assinatura
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscriptionStatus ENUM('active', 'inactive', 'trial') NOT NULL DEFAULT 'trial' AFTER role;

-- 4. Adicionar data de vencimento da assinatura
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscriptionExpiresAt TIMESTAMP NULL AFTER subscriptionStatus;

-- 5. Adicionar campo de ativo/inativo
ALTER TABLE users ADD COLUMN IF NOT EXISTS isActive INT NOT NULL DEFAULT 1 AFTER subscriptionExpiresAt;

-- 6. Tornar email único (se não for ainda)
ALTER TABLE users MODIFY COLUMN email VARCHAR(320) NULL;
ALTER TABLE users ADD UNIQUE INDEX IF NOT EXISTS users_email_unique (email);

-- 7. Criar o primeiro usuário admin (ALTERE o email e a senha conforme necessário)
-- A senha abaixo é um placeholder - o sistema vai usar bcrypt para verificar
-- Para criar o admin, use o script: node scripts/create-admin.mjs

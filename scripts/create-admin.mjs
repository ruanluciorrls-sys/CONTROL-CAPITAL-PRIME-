// Script para criar o primeiro usuário admin
// Execute: node scripts/create-admin.mjs
// Defina as variáveis de ambiente DATABASE_URL antes de rodar

import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Erro: Variável DATABASE_URL não definida!');
  console.error('   Execute: DATABASE_URL="mysql://..." node scripts/create-admin.mjs');
  process.exit(1);
}

// Configurações do admin — altere aqui:
const ADMIN_NAME  = 'Ruan Admin';
const ADMIN_EMAIL = 'admin@capitalprime.com';
const ADMIN_PASS  = 'SenhaForte2026!';

async function main() {
  console.log('🔗 Conectando ao banco de dados...');
  const conn = await mysql.createConnection(DATABASE_URL);

  const passwordHash = await bcrypt.hash(ADMIN_PASS, 12);
  const openId = `local_admin_${Date.now()}`;

  try {
    await conn.execute(
      `INSERT INTO users (openId, name, email, passwordHash, role, subscriptionStatus, isActive, lastSignedIn)
       VALUES (?, ?, ?, ?, 'admin', 'active', 1, NOW())
       ON DUPLICATE KEY UPDATE passwordHash = VALUES(passwordHash), role = 'admin', isActive = 1`,
      [openId, ADMIN_NAME, ADMIN_EMAIL, passwordHash]
    );
    console.log('✅ Admin criado com sucesso!');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Senha: ${ADMIN_PASS}`);
    console.log('\n⚠️  IMPORTANTE: Troque a senha após o primeiro login!');
  } catch (err) {
    console.error('❌ Erro ao criar admin:', err.message);
  }

  await conn.end();
}

main();

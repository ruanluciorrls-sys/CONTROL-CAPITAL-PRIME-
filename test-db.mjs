import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function check() {
  const users = await sql`SELECT email, "passwordHash" FROM users`;
  console.log("Users in DB:", users);

  if (users.length > 0) {
    const match = await bcrypt.compare("SenhaForte2026!", users[0].passwordHash);
    console.log("Does 'SenhaForte2026!' match?", match);

    const match2 = await bcrypt.compare("SenhaForte2026", users[0].passwordHash);
    console.log("Does 'SenhaForte2026' match?", match2);
  }
  await sql.end();
}

check();

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Credenciais ANTIGAS (da plataforma Manus)
const OLD_URL = "https://clmmijcxcxiiregyzlqe.supabase.co";
const OLD_KEY = "sb_publishable_ngCUw6J_gAH7mywmdwqMeg_xWqFSSoY";

const supabase = createClient(OLD_URL, OLD_KEY);

async function fazerBackup() {
  console.log("Conectando ao banco de dados antigo...");
  
  // Buscar Casas
  const { data: casas, error: erroCasas } = await supabase.from('casas').select('*');
  if (erroCasas) {
    console.error("Erro ao buscar casas:", erroCasas.message);
    return;
  }
  
  // Buscar Relatorios
  const { data: relatorios, error: erroRelatorios } = await supabase.from('relatorios').select('*');
  if (erroRelatorios) {
    console.error("Erro ao buscar relatorios:", erroRelatorios.message);
    return;
  }
  
  const backup = {
    casas: casas || [],
    relatorios: relatorios || []
  };
  
  fs.writeFileSync('backup_dados.json', JSON.stringify(backup, null, 2));
  
  console.log("==========================================");
  console.log("✅ BACKUP REALIZADO COM SUCESSO!");
  console.log(`Foram salvas ${backup.casas.length} casas e ${backup.relatorios.length} relatórios.`);
  console.log("O arquivo 'backup_dados.json' foi criado na sua pasta!");
  console.log("==========================================");
}

fazerBackup();

import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

// Pula quando as variáveis de ambiente não estão presentes (ex.: rodando local sem .env)
const temEnv = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY;

describe.skipIf(!temEnv)("Supabase Connection", () => {
  it("should connect to Supabase with valid credentials", async () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    expect(supabaseUrl).toBeDefined();
    expect(supabaseAnonKey).toBeDefined();

    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

    // Test connection by fetching auth status
    const { data, error } = await supabase.auth.getSession();
    
    // We expect either a session or no error (unauthenticated is OK)
    expect(error).toBeNull();
  });

  it("should have service role key configured", () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(serviceRoleKey).toBeDefined();
    expect(serviceRoleKey).toMatch(/^sb_secret_/);
  });
});

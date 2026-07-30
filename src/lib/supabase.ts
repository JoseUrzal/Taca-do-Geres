import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Só no servidor (route handlers). A service-role key NUNCA vai para o cliente.
let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Faltam variáveis de ambiente do Supabase");
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Bucket público donde viven las fotos de productos. */
export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "product-images";

let client: SupabaseClient | undefined;

/**
 * Cliente de Supabase con service_role key para operaciones de servidor
 * (subir/borrar fotos). Se crea de forma perezosa para no fallar el build
 * cuando las variables aún no están configuradas.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.",
    );
  }

  client = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  return client;
}

function readEnv(name: string) {
  return process.env[name]?.trim() || "";
}

function deriveSupabaseUrl(databaseUrl: string) {
  const match = databaseUrl.match(/postgres\.([a-z0-9]+):/i);
  if (!match?.[1]) {
    return "";
  }

  return `https://${match[1]}.supabase.co`;
}

export const appEnv = {
  databaseUrl: readEnv("DATABASE_URL"),
  groqApiKey: readEnv("GROQ_API_KEY"),
  groqModel: readEnv("GROQ_MODEL") || "openai/gpt-oss-20b",
  supabaseUrl: "",
  supabaseAnonKey:
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") || readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  capacitorServerUrl: readEnv("CAPACITOR_SERVER_URL"),
  appUrl: readEnv("NEXT_PUBLIC_APP_URL") || "http://localhost:3000",
};

appEnv.supabaseUrl =
  readEnv("NEXT_PUBLIC_SUPABASE_URL") || deriveSupabaseUrl(appEnv.databaseUrl);

export function hasDatabaseConfig() {
  return Boolean(appEnv.databaseUrl);
}

export function hasGroqConfig() {
  return Boolean(appEnv.groqApiKey);
}

export function hasSupabaseAuthConfig() {
  return Boolean(appEnv.supabaseUrl && appEnv.supabaseAnonKey);
}

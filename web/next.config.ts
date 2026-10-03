import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // sharp es un módulo nativo: se carga desde node_modules en runtime,
  // no se empaqueta (evita crashes en el runtime serverless de Vercel).
  serverExternalPackages: ["sharp"],
  turbopack: {
    // Fija la raíz a este proyecto para evitar que Next infiera
    // la carpeta de usuario por otro package-lock.json.
    root: path.join(__dirname),
  },
};

export default nextConfig;

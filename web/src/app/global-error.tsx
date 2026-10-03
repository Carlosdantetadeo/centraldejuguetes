"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#ffffff",
          color: "#14181c",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ margin: "0.75rem 0", fontSize: "1.5rem" }}>
            Algo salió mal
          </h1>
          <p style={{ margin: "0 0 1.5rem", color: "#64717a" }}>
            Ocurrió un error inesperado. Intenta de nuevo.
          </p>
          <button
            onClick={reset}
            style={{
              border: "none",
              borderRadius: "0.75rem",
              background: "#262d33",
              color: "#fff",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}

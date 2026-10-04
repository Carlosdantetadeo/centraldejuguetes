// Evita que un valor con "</script>" (ej. nombre/descripción de producto)
// cierre el tag antes de tiempo e inyecte HTML.
function serialize(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  );
}

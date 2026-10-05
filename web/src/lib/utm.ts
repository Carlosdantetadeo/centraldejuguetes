const UTM_KEY = "cm_utm_v1";

export type StoredUtm = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  fbclid?: string;
  gclid?: string;
};

// Se llama una vez al montar el layout (ver UtmCapture.tsx). Solo guarda
// en la primera visita con parámetros — no sobreescribe una atribución
// ya capturada si el usuario navega después sin esos parámetros.
export function captureUtmFromUrl(search: string): void {
  const params = new URLSearchParams(search);
  const utm: StoredUtm = {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    fbclid: params.get("fbclid") ?? undefined,
    gclid: params.get("gclid") ?? undefined,
  };
  const hasAny = Object.values(utm).some(Boolean);
  if (!hasAny) return;

  try {
    if (localStorage.getItem(UTM_KEY)) return; // ya hay una atribución guardada
    localStorage.setItem(UTM_KEY, JSON.stringify(utm));
  } catch {
    /* ignore */
  }
}

export function getStoredUtm(): StoredUtm {
  try {
    const raw = localStorage.getItem(UTM_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

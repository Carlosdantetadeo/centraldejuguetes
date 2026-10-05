import { AI_REFERRER_DOMAINS } from "@/lib/constants";

const UTM_KEY = "cm_utm_v1";

export type StoredUtm = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  fbclid?: string;
  gclid?: string;
};

function aiDomainFromReferrer(referrer: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return AI_REFERRER_DOMAINS.find((domain) => host === domain) ?? null;
  } catch {
    return null;
  }
}

// Se llama una vez al montar el layout (ver UtmCapture.tsx). Solo guarda
// en la primera visita con parámetros/referrer de IA — no sobreescribe
// una atribución ya capturada si el usuario navega después sin eso.
//
// GEO fase 5 §2: si no vino utm_source pero el referrer es un motor de
// IA conocido (chatgpt.com, perplexity.ai, etc. — un humano hizo clic en
// una respuesta, no un bot), se usa ese dominio como utm_source. Así los
// pre-pedidos cerrados por WhatsApp quedan atribuibles a tráfico de IA
// aunque el link no tuviera parámetros.
export function captureUtmFromUrl(search: string, referrer = ""): void {
  const params = new URLSearchParams(search);
  const aiDomain = aiDomainFromReferrer(referrer);

  const utm: StoredUtm = {
    utmSource: params.get("utm_source") ?? aiDomain ?? undefined,
    utmMedium: params.get("utm_medium") ?? (aiDomain ? "ai-referral" : undefined),
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

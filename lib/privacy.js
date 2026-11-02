export const PRIVACY_KEY = 'leyde_privacidade_v1';
export const PRIVACY_VERSION = 2;
export const CONSENT_DAYS = 180;
export const GA_ID = /^G-[A-Z0-9]{5,20}$/.test(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '') ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID : '';
const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '1784326125895756';
export const META_PIXEL_ID = /^\d{8,25}$/.test(pixelId) ? pixelId : '';
export const providerId = (id = GA_ID, pixel = META_PIXEL_ID) => [id && `ga4:${id}`, pixel && `meta:${pixel}`].filter(Boolean).join('|') || 'nenhum';

export function criarPreferencias(choices, provider = providerId(), now = Date.now()) {
  const requested = typeof choices === 'boolean' ? { analytics: choices, marketing: false } : choices || {};
  return { version: PRIVACY_VERSION, provider, necessary: true, analytics: provider.includes('ga4:') && requested.analytics === true, marketing: provider.includes('meta:') && requested.marketing === true, updatedAt: now };
}

export function lerPreferencias(raw, provider = providerId(), now = Date.now()) {
  try {
    const value = JSON.parse(raw);
    if (value?.version !== PRIVACY_VERSION || value.provider !== provider || value.necessary !== true
      || typeof value.analytics !== 'boolean' || typeof value.marketing !== 'boolean' || !Number.isFinite(value.updatedAt)
      || value.updatedAt > now || now - value.updatedAt >= CONSENT_DAYS * 86400000) return null;
    return criarPreferencias(value, provider, value.updatedAt);
  } catch { return null; }
}

export function permiteEstatisticas(preferences, { id = GA_ID, pixel = META_PIXEL_ID, privacySignal = false, now = Date.now() } = {}) {
  return Boolean(id && !privacySignal && lerPreferencias(JSON.stringify(preferences), providerId(id, pixel), now)?.analytics);
}

export function permitePublicidade(preferences, { id = META_PIXEL_ID, analyticsId = GA_ID, privacySignal = false, now = Date.now() } = {}) {
  return Boolean(id && !privacySignal && lerPreferencias(JSON.stringify(preferences), providerId(analyticsId, id), now)?.marketing);
}

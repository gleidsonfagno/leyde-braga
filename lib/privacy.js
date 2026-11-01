export const PRIVACY_KEY = 'leyde_privacidade_v1';
export const PRIVACY_VERSION = 1;
export const CONSENT_DAYS = 180;
export const GA_ID = /^G-[A-Z0-9]{5,20}$/.test(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '') ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID : '';
export const providerId = (id = GA_ID) => id ? `ga4:${id}` : 'nenhum';

export function criarPreferencias(analytics, provider = providerId(), now = Date.now()) {
  return { version: PRIVACY_VERSION, provider, necessary: true, analytics: provider !== 'nenhum' && analytics === true, updatedAt: now };
}

export function lerPreferencias(raw, provider = providerId(), now = Date.now()) {
  try {
    const value = JSON.parse(raw);
    if (value?.version !== PRIVACY_VERSION || value.provider !== provider || value.necessary !== true
      || typeof value.analytics !== 'boolean' || !Number.isFinite(value.updatedAt)
      || value.updatedAt > now || now - value.updatedAt >= CONSENT_DAYS * 86400000) return null;
    return criarPreferencias(value.analytics, provider, value.updatedAt);
  } catch { return null; }
}

export function permiteEstatisticas(preferences, { id = GA_ID, privacySignal = false, now = Date.now() } = {}) {
  return Boolean(id && !privacySignal && lerPreferencias(JSON.stringify(preferences), providerId(id), now)?.analytics);
}

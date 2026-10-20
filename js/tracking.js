import { CONFIG } from "./config.js";

const CONSENT_KEY = "collina_consent_v1";
const UTM_KEY = "collina_utm_v1";
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"];

const store = {
  get(key, area = localStorage) {
    try { return area.getItem(key); } catch { return null; }
  },
  set(key, value, area = localStorage) {
    try { area.setItem(key, value); } catch { /* storage indisponível */ }
  },
};

/* ---------- UTMs: guardadas na sessão e anexadas às mensagens de WhatsApp ---------- */
export function captureUtms() {
  const params = new URLSearchParams(location.search);
  const found = {};
  UTM_PARAMS.forEach((k) => { if (params.get(k)) found[k] = params.get(k); });
  if (Object.keys(found).length) store.set(UTM_KEY, JSON.stringify(found), sessionStorage);
}

export function getUtms() {
  try { return JSON.parse(store.get(UTM_KEY, sessionStorage) || "{}"); } catch { return {}; }
}

export function utmSignature() {
  const u = getUtms();
  const parts = [u.utm_source, u.utm_medium, u.utm_campaign].filter(Boolean);
  return parts.length ? `\n\n[origem: ${parts.join(" / ")}]` : "";
}

/* ---------- Carregamento dos pixels (somente após consentimento) ---------- */
function loadScript(src) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

let loaded = false;
function loadTags() {
  if (loaded) return;
  loaded = true;
  const t = CONFIG.tracking;
  window.dataLayer = window.dataLayer || [];

  if (t.gtm) {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    loadScript(`https://www.googletagmanager.com/gtm.js?id=${t.gtm}`);
  }

  const gtagId = t.ga4 || t.googleAds;
  if (gtagId) {
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${gtagId}`);
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    if (t.ga4) window.gtag("config", t.ga4);
    if (t.googleAds) window.gtag("config", t.googleAds);
  }

  if (t.metaPixel) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq("init", t.metaPixel);
    window.fbq("track", "PageView");
  }
}

/* ---------- Eventos ---------- */
/**
 * @param {string} name   nome do evento (ex: "click_whatsapp")
 * @param {object} params dados extras
 * @param {"Lead"|"Contact"|null} metaStd evento padrão do Meta, se aplicável
 */
export function track(name, params = {}, metaStd = null) {
  const payload = { ...params, ...getUtms() };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...payload });

  if (typeof window.gtag === "function") {
    window.gtag("event", name, payload);
    const t = CONFIG.tracking;
    if (metaStd === "Lead" && t.googleAds && t.googleAdsLeadLabel) {
      window.gtag("event", "conversion", { send_to: `${t.googleAds}/${t.googleAdsLeadLabel}` });
    }
  }
  if (typeof window.fbq === "function") {
    if (metaStd) window.fbq("track", metaStd, params);
    else window.fbq("trackCustom", name, params);
  }
}

/* ---------- Banner de consentimento (LGPD) ---------- */
export function initConsent() {
  const banner = document.querySelector("[data-consent]");
  const choice = store.get(CONSENT_KEY);
  const hasTags = Object.values(CONFIG.tracking).some(Boolean);

  if (choice === "accepted") { loadTags(); return; }
  if (choice === "rejected" || !hasTags || !banner) return;

  banner.hidden = false;
  requestAnimationFrame(() => banner.classList.add("is-visible"));

  banner.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-consent-action]");
    if (!btn) return;
    const accepted = btn.dataset.consentAction === "accept";
    store.set(CONSENT_KEY, accepted ? "accepted" : "rejected");
    if (accepted) loadTags();
    banner.classList.remove("is-visible");
    setTimeout(() => (banner.hidden = true), 400);
  });
}

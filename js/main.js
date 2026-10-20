import { CONFIG } from "./config.js";
import { captureUtms, initConsent, track, utmSignature } from "./tracking.js";

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const waLink = (msg = CONFIG.whatsappDefaultMsg) =>
  `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg + utmSignature())}`;

const fullAddress = () => {
  const a = CONFIG.address;
  return `${a.street} - ${a.district}, ${a.city} - ${a.state}, ${a.zip}`;
};

/* ---------- Liga os links dinâmicos a partir do config ---------- */
function hydrateLinks() {
  $$("[data-wa]").forEach((a) => {
    a.href = waLink();
    a.target = "_blank";
    a.rel = "noopener";
  });
  $$("[data-phone]").forEach((el) => (el.textContent = CONFIG.phoneDisplay));
  $$("[data-instagram]").forEach((a) => (a.href = CONFIG.instagram));
  $$("[data-app]").forEach((a) => (a.href = CONFIG.apps[a.dataset.app]));
  $$("[data-community]").forEach((a) => (a.href = CONFIG.communities[a.dataset.community]));

  const q = encodeURIComponent(`Collina Sports, ${fullAddress()}`);
  $$("[data-maps='google']").forEach((a) => (a.href = `https://www.google.com/maps/search/?api=1&query=${q}`));
  $$("[data-maps='waze']").forEach((a) => (a.href = `https://waze.com/ul?q=${q}&navigate=yes`));

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
}

/* ---------- Vídeo do hero: carrega só depois do conteúdo principal ---------- */
function initHeroVideo() {
  const video = $("[data-hero-video]");
  const btn = $("[data-video-sound]");
  if (!video) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = navigator.connection?.saveData;

  const setState = (paused) => btn?.setAttribute("aria-pressed", String(paused));
  const load = () => {
    const src = $("source[data-src]", video);
    if (src && !src.src) { src.src = src.dataset.src; video.load(); }
  };
  const play = () => { load(); video.play().then(() => setState(false)).catch(() => setState(true)); };

  if (reduce || saveData) setState(true);
  else {
    const start = () => play();
    "requestIdleCallback" in window ? requestIdleCallback(start, { timeout: 2500 }) : setTimeout(start, 1200);
    // pausa quando sai da tela (economia de bateria)
    new IntersectionObserver(([e]) => {
      if (!video.dataset.userPaused && video.currentSrc) e.isIntersecting ? video.play().catch(() => {}) : video.pause();
    }).observe(video);
  }

  btn?.addEventListener("click", () => {
    if (video.paused) { delete video.dataset.userPaused; play(); track("video_play"); }
    else { video.pause(); video.dataset.userPaused = "1"; setState(true); }
  });
}

/* ---------- Galeria + lightbox ---------- */
function initGallery() {
  const tiles = $$("[data-gallery] [data-full]");
  const dlg = $("[data-lightbox]");
  if (!tiles.length || !dlg || typeof dlg.showModal !== "function") return;
  const img = $("[data-lb-img]", dlg);
  const cap = $("[data-lb-cap]", dlg);
  let i = 0;

  const show = (n) => {
    i = (n + tiles.length) % tiles.length;
    const t = tiles[i];
    img.src = t.dataset.full;
    img.alt = $("img", t)?.alt || "";
    cap.textContent = `${t.dataset.caption}  ·  ${i + 1}/${tiles.length}`;
  };
  tiles.forEach((t, n) => t.addEventListener("click", () => {
    show(n); dlg.showModal(); track("gallery_open", { foto: t.dataset.caption });
  }));
  $("[data-lb-close]", dlg).addEventListener("click", () => dlg.close());
  $("[data-lb-prev]", dlg).addEventListener("click", () => show(i - 1));
  $("[data-lb-next]", dlg).addEventListener("click", () => show(i + 1));
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(i - 1);
    if (e.key === "ArrowRight") show(i + 1);
  });

  // swipe no celular
  let x0 = null;
  dlg.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
  dlg.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(dx < 0 ? i + 1 : i - 1);
    x0 = null;
  });
}

/* ---------- Localização: abas, mapa e tour 360° ---------- */
const PANNELLUM = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/";

function loadPannellum() {
  if (window.pannellum) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = PANNELLUM + "pannellum.css";
    document.head.appendChild(css);
    const js = document.createElement("script");
    js.src = PANNELLUM + "pannellum.js";
    js.onload = resolve; js.onerror = reject;
    document.head.appendChild(js);
  });
}

function initLocation() {
  const map = $("[data-map-src]");
  const loadMap = () => {
    if (map && !map.src) map.src = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress())}&output=embed`;
  };

  // abas acessíveis (setas do teclado)
  const tabs = $$("[data-tab]");
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $("#" + t.getAttribute("aria-controls")).hidden = !on;
    });
    if (tab.id === "tab-map") { loadMap(); track("tab_mapa"); }
  };
  tabs.forEach((t, n) => {
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = tabs[(n + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      next.focus(); select(next);
    });
  });

  // tour 360° — Pannellum só é baixado quando a pessoa clica
  const pano = $("[data-pano]");
  const start = $("[data-pano-start]");
  start?.addEventListener("click", async () => {
    start.disabled = true;
    start.lastChild.textContent = " Carregando…";
    try {
      await loadPannellum();
      const box = document.createElement("div");
      box.id = "pano-viewer";
      pano.appendChild(box);
      window.pannellum.viewer(box, {
        type: "equirectangular",
        panorama: pano.dataset.panoSrc,
        autoLoad: true,
        autoRotate: -2,
        yaw: -60,
        hfov: 100,
        showControls: true,
        compass: false,
        mouseZoom: false,
      });
      pano.classList.add("is-live");
      start.remove();
      $(".pano__poster", pano)?.remove();
    } catch {
      start.disabled = false;
      start.lastChild.textContent = " Tentar de novo";
    }
  });
}

/* ---------- Header: estado ao rolar + menu mobile ---------- */
function initHeader() {
  const header = $("[data-header]");
  const burger = $("[data-burger]");
  const nav = $("[data-nav]");
  const mbar = $("[data-mbar]");

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 24);
    mbar?.classList.toggle("is-visible", y > window.innerHeight * 0.6);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setMenu = (open) => {
    burger.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    header.classList.toggle("menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });
}

/* ---------- Animações de entrada ---------- */
function initReveal() {
  const items = $$(".reveal");
  if (!("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("is-in")); return; }

  // escalonamento leve entre irmãos
  items.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    const i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty("--d", `${Math.min(i, 5) * 0.08}s`);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  items.forEach((el) => io.observe(el));
}

/* ---------- Parallax suave no visual do hero ---------- */
function initParallax() {
  const visual = $(".hero__visual");
  if (!visual || matchMedia("(prefers-reduced-motion: reduce)").matches || matchMedia("(pointer: coarse)").matches) return;
  let raf = 0;
  window.addEventListener("pointermove", (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const x = (e.clientX / innerWidth - 0.5) * 14;
      const y = (e.clientY / innerHeight - 0.5) * 14;
      visual.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  });
}

/* ---------- Tracking de cliques (data-track) ---------- */
function initClickTracking() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-track]");
    if (!el) return;
    const isWa = el.hasAttribute("data-wa") || el.href?.includes("wa.me");
    const isCommunity = el.hasAttribute("data-community");
    track(el.dataset.track, { label: el.textContent.trim().slice(0, 60) }, isWa || isCommunity ? "Contact" : null);

    // Cards de modalidade pré-selecionam a opção no formulário
    if (el.dataset.sport) {
      const radio = $(`input[name="modalidade"][value="${el.dataset.sport}"]`);
      if (radio) radio.checked = true;
    }
  });
}

/* ---------- Máscara de telefone ---------- */
function maskPhone(v) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/* ---------- Formulário → WhatsApp ---------- */
function initLeadForm() {
  const form = $("[data-lead-form]");
  if (!form) return;
  const status = $("[data-form-status]", form);
  const defaultNote = status.textContent;

  const phone = $("[data-phone-mask]", form);
  phone.addEventListener("input", () => (phone.value = maskPhone(phone.value)));

  let started = false;
  form.addEventListener("focusin", () => {
    if (!started) { started = true; track("form_start"); }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const nome = data.nome.trim();
    const digits = data.telefone.replace(/\D/g, "");

    const errors = [];
    $("#f-nome").setAttribute("aria-invalid", String(nome.length < 2));
    $("#f-tel").setAttribute("aria-invalid", String(digits.length < 10));
    if (nome.length < 2) errors.push("seu nome");
    if (digits.length < 10) errors.push("um WhatsApp válido com DDD");

    if (errors.length) {
      status.textContent = `Falta só ${errors.join(" e ")} 😉`;
      status.classList.add("is-error");
      form.querySelector("[aria-invalid='true']")?.focus();
      return;
    }
    status.textContent = defaultNote;
    status.classList.remove("is-error");

    const msg =
      `Olá, Collina! Sou ${nome} e quero jogar 🎾\n` +
      `• Modalidade: ${data.modalidade}\n` +
      `• Melhor período: ${data.periodo}\n` +
      `• Meu WhatsApp: ${data.telefone}`;

    track("generate_lead", { modalidade: data.modalidade, periodo: data.periodo }, "Lead");
    window.open(waLink(msg), "_blank", "noopener");
    status.textContent = "Abrimos o WhatsApp pra você. É só enviar a mensagem! ✅";
  });
}

/* ---------- Boot ---------- */
document.documentElement.classList.remove("no-js");
captureUtms();
hydrateLinks();
initHeader();
initReveal();
initParallax();
initClickTracking();
initLeadForm();
initHeroVideo();
initGallery();
initLocation();
initConsent();

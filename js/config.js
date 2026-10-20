/**
 * Collina Sports — configuração central da landing page.
 * Edite SOMENTE este arquivo para trocar contatos, links e IDs de anúncios.
 */
export const CONFIG = {
  brand: "Collina Sports",

  // Contato
  whatsapp: "5554991510159", // DDI + DDD + número, só dígitos
  whatsappDefaultMsg: "Olá! Vim pelo site e gostaria de mais informações!",
  phoneDisplay: "(54) 99151-0159",

  // Endereço
  address: {
    street: "R. Lourenço Menegaz, 1478",
    district: "Panazzolo",
    city: "Caxias do Sul",
    state: "RS",
    zip: "95082-110",
  },

  // Apps — os links não estavam no Linktree; cole aqui as URLs reais das lojas
  apps: {
    android: "https://play.google.com/store", // TODO: link do app na Google Play
    ios: "https://www.apple.com/app-store/", // TODO: link do app na App Store
  },

  // Comunidades no WhatsApp
  communities: {
    geral: "https://chat.whatsapp.com/C7QuZJgrHls8aSeeA5KmUm",
    pickleball: "https://chat.whatsapp.com/G8tWAYCdo2Y9cC9o66SiMv",
  },

  instagram: "https://www.instagram.com/collinasportsoficial/",

  // Tracking — deixe vazio ("") para desativar. Só carregam após o consentimento de cookies (LGPD).
  tracking: {
    ga4: "", // ex: "G-XXXXXXXXXX"
    googleAds: "", // ex: "AW-123456789"
    googleAdsLeadLabel: "", // ex: "AbCdEfGhIjk" (rótulo da conversão de Lead)
    metaPixel: "", // ex: "123456789012345"
    gtm: "", // ex: "GTM-XXXXXXX" (opcional: se usar GTM, pode deixar os outros vazios)
  },
};

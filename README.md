# Collina Sports — Landing Page

Landing page do complexo esportivo **Collina Sports** (Caxias do Sul — RS).
HTML + CSS + JavaScript moderno (ES Modules), **sem build e sem dependências** — é subir no GitHub e importar na Vercel.

## Estrutura

```
collina-sports/
├── index.html                  # página principal
├── politica-de-privacidade.html
├── css/styles.css              # todo o visual (tokens de cor no topo)
├── js/
│   ├── config.js               # ⚙️ CONTATOS, LINKS E IDs DE ANÚNCIOS — edite aqui
│   ├── tracking.js             # GA4, Google Ads, Meta Pixel, UTMs e consentimento LGPD
│   └── main.js                 # menu, animações, formulário → WhatsApp
├── assets/
│   ├── img/                    # fotos em WebP (640 e 1280px) + panorama 360° (tour-360.jpg)
│   ├── video/                  # tour da arena (MP4 720p, ~3 MB) + poster
│   └── logo.svg, favicon.svg, og-image.jpg, apple-touch-icon.png
├── vercel.json                 # URLs limpas, cache e headers de segurança
├── robots.txt / sitemap.xml
```

## Antes de publicar (checklist)

1. **Links dos apps** — em `js/config.js`, troque `apps.android` e `apps.ios` pelos links reais da Google Play e App Store (o Linktree não expunha essas URLs).
2. **Logo oficial** — o `assets/logo.svg` é uma recriação do selo. Se tiver o arquivo original (SVG/PNG), substitua `assets/logo.svg` e `assets/favicon.svg` mantendo os nomes.
3. **Domínio** — se usar domínio próprio (ex.: `collinasports.com.br`), troque `https://collina-sports.vercel.app` em `index.html`, `robots.txt` e `sitemap.xml`.
4. **Textos** — confira o card “Torneios, eventos e grupos” e o FAQ (equipamentos, eventos, arena coberta) com a operação real.
5. **Tour 360° / foto da fachada** — `tour-360.jpg` e `streetview-fachada.webp` parecem vir do Google Street View (há marca d'água © Google). Os termos do Google não permitem hospedar essas imagens no seu site. O ideal é trocar por um 360° próprio (dá pra fazer com o celular, no modo panorama/Photo Sphere) mantendo os mesmos nomes de arquivo.
6. **Pixels** — preencha os IDs em `config.js` → `tracking` (veja abaixo).

## Mídias

- Fotos novas: exporte em WebP com 640px e 1280px de largura (ex.: `squoosh.app`) e use o padrão `nome-640.webp` / `nome-1280.webp`.
- O vídeo do hero só começa a baixar depois que a página carregou; não baixa com "economia de dados" ativa nem para quem prefere menos movimento.
- O tour 360° usa o [Pannellum](https://pannellum.org) via CDN e só é baixado quando o visitante clica em "Explorar em 360°".

## Deploy (GitHub + Vercel)

```bash
cd collina-sports
git init
git add .
git commit -m "Landing page Collina Sports"
git branch -M main
git remote add origin https://github.com/joelpassos-1986/collina_sports.git
git push -u origin main
```

Na Vercel: **Add New → Project → Import** o repositório → *Framework Preset: Other* → **Deploy**.
Não precisa de build command nem output directory.

Para testar localmente (ES Modules não abrem via `file://`):

```bash
npx serve .        # ou: python -m http.server 8000
```

## Anúncios e mensuração

Preencha em `js/config.js`:

| Campo | Exemplo | Para quê |
|---|---|---|
| `ga4` | `G-XXXXXXX` | Google Analytics 4 |
| `googleAds` | `AW-123456789` | Tag do Google Ads |
| `googleAdsLeadLabel` | `AbCdEf...` | Rótulo da conversão de Lead |
| `metaPixel` | `1234567890` | Meta Pixel (Facebook/Instagram Ads) |
| `gtm` | `GTM-XXXXXX` | Opcional, se preferir gerenciar tudo no GTM |

As tags **só carregam depois que o visitante aceita os cookies** (LGPD). Sem nenhum ID preenchido, o aviso de cookies nem aparece.

### Eventos disparados

| Evento | Quando | Meta (padrão) |
|---|---|---|
| `generate_lead` | envio do formulário → WhatsApp | `Lead` + conversão Google Ads |
| `form_start` | primeiro foco no formulário | — |
| `cta_*`, `mbar_*`, `footer_*` | cliques nos botões | `Contact` quando abre WhatsApp |
| `community_geral` / `community_pickleball` | entrada nos grupos | `Contact` |
| `app_android` / `app_ios` | cliques nas lojas | custom |
| `maps_google` / `maps_waze` | rota | custom |
| `tour_360`, `tab_mapa` | interação com localização | custom |
| `gallery_open`, `video_play` | galeria e vídeo | custom |

Todos também vão para o `dataLayer` (útil no GTM).

### UTMs

UTMs (`utm_source`, `utm_medium`, `utm_campaign`…) e `gclid`/`fbclid` da URL são guardados na sessão e **anexados à mensagem do WhatsApp** (`[origem: instagram / cpc / beach-verao]`), então a recepção sabe de qual campanha veio cada lead.

Sugestão de URLs para os anúncios:

```
Meta Ads:   https://SEU-DOMINIO/?utm_source=instagram&utm_medium=paid&utm_campaign=beach-tennis
Google Ads: https://SEU-DOMINIO/?utm_source=google&utm_medium=cpc&utm_campaign=pickleball-caxias
Bio Insta:  https://SEU-DOMINIO/?utm_source=instagram&utm_medium=bio
```

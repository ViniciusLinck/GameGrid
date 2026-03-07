# GameGrid | Copa do Mundo 2026

Aplicacao web SPA para acompanhar a Copa do Mundo Masculina 2026 com foco em UX, navegacao rapida, visual imersivo e dados dinamicos (API + fallback local).

Site publicado: `https://viniciuslinck.github.io/GameGrid/`

## Visao Geral

O GameGrid entrega:

- Calendario completo com 104 jogos
- Filtros por fase + busca por selecao
- Pagina detalhada de time
- Pagina detalhada de jogador
- Lista de conquistas de jogador e tecnico
- Intro animada com GSAP
- Fundo 3D com Three.js reativo a interacao
- Transicoes visuais entre rotas
- SEO tecnico para indexacao
- UI em portugues e navegacao orientada por contexto

## Funcionalidades Implementadas

### 1. Home (Calendario)

- Exibe jogos agrupados por dia
- Filtro por fase (`Todas as fases` + fases disponiveis)
- Busca de jogos por nome de selecao (home/away)
- Botao para limpar filtros
- Dashboard com:
- total de jogos
- proximo jogo
- seletor de fase
- campo de busca
- Cards de jogo com:
- numero do jogo
- fase
- confronto com bandeiras
- data e horario
- estadio e cidade
- link para Google Maps
- Atualizacao automatica de dados da API a cada 5 minutos

### 2. Pagina de Time

- Hero com resumo da selecao
- Estatisticas:
- Copas do Mundo
- melhor campanha
- ranking FIFA
- Ultimas 5 Copas (track visual)
- Grade com 11 jogadores principais
- Card de jogador com imagem/fallback, posicao e acao de abrir perfil
- Atalhos de secao (`Resumo do time` e `Elenco principal`)

### 3. Pagina de Jogador

- Card detalhado com:
- nome
- time
- posicao
- nacionalidade
- nascimento
- altura
- peso
- descricao
- Secao de conquistas em 2 cards:
- conquistas do jogador
- conquistas do tecnico
- Contador animado de total de conquistas
- Animacao progressiva dos itens de conquista visiveis no viewport
- Atalhos de secao (`Perfil` e `Conquistas`)

### 4. Navegacao Global

- Top bar fixa com navegacao principal
- Breadcrumb dinamico por rota
- Indicador de contexto (`Voce esta em`)
- Skip link para pular direto para o conteudo principal
- Botao flutuante `Voltar ao topo`
- Rota de compatibilidade `/home` redirecionando para `/`
- Pagina 404 personalizada

### 5. Animacoes e Imersao

- Intro cinematografica de abertura (com botao `Pular`)
- Parallax leve no hero da Home (logo/titulo/subtitulo)
- Entrada com stagger em cards e secoes
- FLIP animation para reordenacao suave dos cards filtrados
- Transicao curta de rota com overlay
- Microinteracao de tilt nos cards de jogador
- Fundo 3D com Three.js:
- globo wireframe animado
- campo de estrelas reativo a ponteiro e scroll
- cometas ocasionais
- estados de intensidade por pagina: `idle`, `focus`, `transition`

## Dados e Integracoes

### Fontes externas

- TheSportsDB (jogos, times, jogadores, conquistas)
- MyMemory Translation API (traducao en -> pt quando necessario)
- Google Maps (link para estadio)

### Estrategia de dados

- Base local com 104 jogos em `src/data/matches2026.js`
- Merge com dados da API quando disponiveis
- Fallback local quando API falha ou retorna incompleto
- Fallback de elenco/tecnico quando necessario

## SEO e Descoberta

- Metatags basicas em `index.html`
- Metatags dinamicas por rota com `useSeo()`:
- `title`, `description`, `canonical`
- Open Graph
- Twitter Cards
- JSON-LD por pagina
- Home com `CollectionPage` + lista de eventos
- Time com `SportsTeam`
- Jogador com `Person`
- 404 com `noindex,nofollow`
- `robots.txt` em `public/robots.txt`
- `sitemap.xml` em `public/sitemap.xml`
- `site.webmanifest` em `public/site.webmanifest`

## Acessibilidade e UX

- Respeita `prefers-reduced-motion`
- Outline visivel para foco (`:focus-visible`)
- Labels e `aria-label` em pontos principais
- Conteudo continua utilizavel sem animacoes
- Layout responsivo para desktop e mobile

## Stack Tecnica

- React 18
- Vite 7
- React Router DOM 7
- GSAP
- Three.js
- Tailwind CSS 3
- PostCSS + Autoprefixer

## Estrutura do Projeto

```text
src/
  animations/
    flip.js
    motionTokens.js
  components/
    IntroKickoff.jsx
    MatchCard.jsx
    PageFrame.jsx
    TeamBadge.jsx
    WorldBackground.jsx
  data/
    matches2026.js
    uiText.js
    worldCupInsights.js
  hooks/
    useBackgroundMood.js
    useMotionPreferences.js
    useSeo.js
  pages/
    HomePage.jsx
    TeamPage.jsx
    PlayerPage.jsx
    NotFoundPage.jsx
  services/
    worldCupApi.js
  styles/
    app.css
  utils/
    flags.js
  App.jsx
  main.jsx
public/
  robots.txt
  sitemap.xml
  site.webmanifest
index.html
```

## Rotas

- `/` -> calendario principal
- `/home` -> redireciona para `/`
- `/time/:teamName` -> detalhes do time + elenco principal
- `/jogador/:playerId?team=...` -> detalhes do jogador + conquistas
- `*` -> pagina 404

## Como Rodar Localmente

### Requisitos

- Node.js 18+
- npm 9+

### Desenvolvimento

```bash
npm install
npm run dev
```

### Build e Preview

```bash
npm run build
npm run preview
```

## Scripts

- `npm run dev` -> inicia servidor de desenvolvimento (Vite)
- `npm run build` -> gera build de producao
- `npm run preview` -> sobe preview local da build

## Deploy

Deploy automatico via GitHub Actions em `.github/workflows/deploy-pages.yml`.

- Branches: `main` e `master`
- Base path de build: `/GameGrid/`
- Publicacao: GitHub Pages
- SPA fallback: `dist/404.html`

## Observacoes

- Projeto sem backend proprio e sem banco de dados
- Dados dependem de APIs publicas e podem variar ao longo do tempo
- Quando a API nao cobre o calendario completo, o app preserva a experiencia com fallback local

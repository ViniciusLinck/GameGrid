# GameGrid - FIFA World Cup 2026 Match Explorer

Projeto frontend para explorar os jogos da Copa do Mundo Masculina 2026 com foco em experiencia visual, navegacao fluida e consumo de API sem banco de dados.

## Sobre o projeto

O GameGrid foi reestruturado de uma versao HTML/CSS/JS para uma aplicacao moderna com React + Vite + Tailwind, incluindo:

- Intro animada cinematografica com bola de futebol (GSAP)
- Background 3D dinamico (Three.js)
- Calendario com 104 jogos (fallback local + merge com API)
- Rotas de detalhe de Time e Jogador
- Tela 404 personalizada
- Links de estadio para Google Maps
- Cards destacados e layout visual refinado para confrontos (team vs team)
- Estatisticas visuais nas paginas de time (titulos, ranking e ultimas 5 copas)
- Favicon customizado

## Preview

Imagens do projeto:

- `assets/projeto-img1.png`
- `assets/projeto-img2..png`

## Tecnologias

- React 18
- Vite 7
- React Router DOM 7
- GSAP
- Three.js
- Tailwind CSS 3
- PostCSS + Autoprefixer

## Arquitetura

```text
src/
  components/
    IntroKickoff.jsx
    MatchCard.jsx
    PageFrame.jsx
    TeamBadge.jsx
    WorldBackground.jsx
  data/
    matches2026.js
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
  favicon.svg
tailwind.config.js
postcss.config.js
```

## Rotas

- `/` - calendario principal
- `/time/:teamName` - detalhes do time e 11 jogadores principais
- `/jogador/:playerId` - card detalhado do jogador
- `*` - 404 Not Found

## Fonte de dados

Sem banco de dados.

O projeto usa API publica:

- TheSportsDB (`https://www.thesportsdb.com/api.php`)

Como o calendario publico 2026 ainda pode estar incompleto na API, o app aplica estrategia hibrida:

1. carrega calendario base local com 104 jogos
2. tenta complementar dados reais da API (datas, confrontos e venues)
3. mantem fallback local quando faltam dados externos
4. atualiza automaticamente os dados da API em intervalos no frontend

## Como executar

### Requisitos

- Node.js 18+
- npm 9+

### Desenvolvimento

```bash
npm install
npm run dev
```

### Build de producao

```bash
npm run build
npm run preview
```

## Scripts

- `npm run dev` - inicia servidor local Vite
- `npm run build` - gera build de producao
- `npm run preview` - sobe preview do build local

## Diferenciais implementados

- Migracao total para SPA com React Router
- Intro de entrada premium com skip e suporte a reduced motion
- Mapeamento robusto de bandeiras com aliases de paises
- Navegacao por time/jogador com carregamento de dados em runtime
- Visual responsivo para desktop e mobile

## Status

Projeto em evolucao continua para portfolio.

Proximos incrementos recomendados:

- cache local de respostas da API para reduzir latencia
- pagina de estatisticas por grupo/fase
- testes automatizados (unitarios + navegacao)

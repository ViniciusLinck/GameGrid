# GameGrid | Copa do Mundo 2026

SPA em React para acompanhar a Copa do Mundo 2026 com foco em UX, dados dinamicos, animacoes e navegacao rapida.

Site publicado: `https://viniciuslinck.github.io/GameGrid/`

## Stack

- React 18 + Vite 7
- React Router DOM 7
- Tailwind CSS 3
- GSAP
- Three.js
- TanStack React Query
- localForage

## Funcionalidades Atuais

### Calendario de jogos (Home)

- Lista de jogos agrupada por dia
- Filtros por fase e busca por selecao
- Dashboard com total de jogos e proximo confronto
- Cards com confronto, horario, estadio, cidade e link do Google Maps
- Botao `Previsao da torcida` por partida
- Botao `Assistir` no card da partida (CazeTV no YouTube)

### Pagina de time

- Hero do time com bandeira, dados principais e estadio
- Blocos de estatisticas e historico recente de Copas
- Grid de jogadores com acesso ao perfil individual
- Microinteracoes de cards (quando animacao esta ativa)

### Pagina de jogador

- Perfil completo do jogador (dados fisicos, nacionalidade, descricao)
- Secao de conquistas (jogador e tecnico)
- Contadores animados de conquistas
- Revelacao progressiva dos itens no viewport

### Previsao da torcida (poll)

- Modo local com persistencia em `localForage`
- Modo remoto opcional com API serverless
- Troca e limpeza de voto
- Barras com percentuais e total de votos
- Historico curto de votos
- Compartilhamento rapido (WhatsApp e Twitter)
- Tratamento de offline e rate-limit

### UX, animacoes e visual

- Intro com GSAP
- Fundo imersivo em Three.js (globo + estrelas)
- Transicao de rotas e entrada progressiva de secoes/cards
- Revelacao dos cards de partidas no scroll (GSAP ScrollTrigger)
- Suporte a `prefers-reduced-motion`
- Header global centralizado e resumo visual centralizado
- Responsividade revisada para desktop, tablet e celular

## Responsividade (ultimos ajustes)

- Melhor distribuicao da `dashboard-bar` com grid adaptativo
- Acoes do card de partida (`Previsao` e `Assistir`) em layout flexivel
- Widget de previsao ajustado para mobile (opcoes em uma coluna no celular)
- Rodape dos cards de partida com melhor leitura em telas pequenas

## SEO e Descoberta

- Meta tags base em `index.html`
- SEO dinamico por rota com `useSeo`
- Open Graph e Twitter Cards
- JSON-LD por pagina (Home, Time, Jogador)
- `robots.txt`, `sitemap.xml` e `site.webmanifest`

## APIs e Integracoes

- TheSportsDB: partidas, times, jogadores e conquistas
- MyMemory Translation API: traducao quando necessario
- Google Maps Search URL: abertura de estadio/cidade no mapa

## Arquivos Importantes

- `src/services/worldCupApi.js`: integracao principal de dados + fallback local
- `src/services/sportsdbApi.js`: funcoes MVP com filtros/tabela
- `src/services/translationApi.js`: traducao
- `src/services/mapsHelper.js`: links de mapa
- `src/components/poll/*`: widget e resultados da previsao
- `src/hooks/usePollLocal.js` e `src/hooks/usePollRemote.js`
- `src/components/mvp/*`: exemplos completos (GameCard, MatchModal, FiltersBar, GroupTable, Countdown)
- `docs/POLL_README.md`: documentacao da feature de poll
- `docs/POLL_ISSUES.md`: backlog em formato de issues
- `docs/SCALING.md`: diretrizes de escalonamento
- `serverless-example/polls-serverless.js`: exemplo de endpoint para votos globais

## Variaveis de Ambiente

Crie um `.env` para controlar o modo de poll:

```bash
VITE_POLL_MODE=local
VITE_POLL_LANG=pt
# somente modo remoto:
VITE_POLL_API_BASE_URL=https://seu-endpoint.com/api
```

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Deploy (GitHub Pages)

Workflow: `.github/workflows/deploy-pages.yml`

- Build com Vite
- Copia `dist/index.html` para `dist/404.html` (SPA fallback)
- Publica no GitHub Pages
- Trigger por push em `main` e `master`

## Observacoes

- Projeto sem backend obrigatorio (frontend-first)
- Sem banco de dados interno
- Favoritos e votos locais ficam no navegador do usuario
- Em caso de falha de API externa, o app usa fallback local para manter a experiencia

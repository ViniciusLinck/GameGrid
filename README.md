# GameGrid | Copa do Mundo 2026

Projeto em React para acompanhar a Copa do Mundo 2026 com foco em UX, dados dinamicos, animacoes e navegacao rapida.

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
- Modo remoto opcional com API serverless e opt-in de privacidade
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

### Privacidade e LGPD

- Pagina de privacidade com transparência sobre dados locais e servicos externos
- Banner de aviso de privacidade no layout global
- Controle para manter a enquete apenas em modo local ou liberar o modo remoto
- Limpeza de dados locais pelo proprio usuario
- Identificador tecnico da enquete com retencao limitada no navegador

## APIs e Integracoes

- TheSportsDB: partidas, times, jogadores e conquistas
- MyMemory Translation API: traducao quando necessario
- Google Maps Search URL: abertura de estadio/cidade no mapa

## Variaveis de Ambiente

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```



# Escalonamento do GameGrid (alto trafego)

## Situacao atual

- Frontend estatico em GitHub Pages (escala bem para arquivos estaticos via CDN).
- Gargalo principal em picos: chamadas diretas do navegador para APIs terceiras (TheSportsDB / traducao / poll remoto).
- Sem backend proprio (bom para custo, mas limitado para agregacao e controle de quota).

## O que ja foi otimizado no codigo

1. Polling inteligente
- Evita refetch em aba oculta.
- Evita refetch quando usuario esta offline.

2. Cache no navegador (TTL)
- Cache local para jogos da Copa no `worldCupApi` (3 min).
- Cache local para feed do `sportsdbApi` (60 s).

3. Reducao de custo de render e payload
- Rotas com `React.lazy` + `Suspense` para code splitting.

## Proxima camada de escala (recomendada)

### 1) Criar uma camada de cache global (edge/serverless)

Mesmo sem backend completo, usar uma funcao serverless para:
- buscar dados da SportsDB
- cachear em memoria/edge por 30-120s
- servir JSON unico para todos os clientes

Beneficio: reduz milhares de chamadas diretas para API externa em horario de pico.

### 2) Isolar o poll remoto em endpoint proprio

- Endpoint `/polls/*` com rate limit por IP e dedupe por clientId.
- Cache curto para `GET /results` (5-15s).

### 3) Monitoramento basico

- Erro de fetch por endpoint
- Tempo medio de resposta
- Taxa de 429
- Volume por minuto

### 4) Politica de fallback

- Se API externa falhar, responder dado cacheado/stale
- Em ultimo caso, fallback local do calendario

## Configuracoes sugeridas de polling

- Jogos gerais: 60s (ativa), pausado em background.
- Poll resultados: 8-30s dependendo do status do jogo.
- Nunca usar polling agressivo em todas as telas simultaneamente.

## Privacidade e compliance

- Nao armazenar PII para analytics/poll sem consentimento.
- `clientId` anonimo local e retencao minima.
- Se usar IP para rate limit, descarte rapido (ex.: 7-30 dias maximo, com aviso de privacidade).

## Checklist para "muita gente acessando"

- [ ] Ativar endpoint serverless de cache da SportsDB
- [ ] Aplicar cache-control adequado na resposta do endpoint
- [ ] Habilitar rate limit por rota critica
- [ ] Garantir fallback stale-while-revalidate
- [ ] Medir erro/latencia em producao
- [ ] Testar carga com k6/Artillery no endpoint serverless

# Tasks / Issues - Poll de Torcida

1) Implementar PollWidget local | Criar widget com 3 opcoes, voto/troca/limpeza usando localForage | 6h | Voto persiste em reload, UI mostra status "voce ja votou"

2) Implementar PollResults acessivel | Criar barras com percentuais, total de votos e mini-historico com ARIA | 4h | Leitor de tela anuncia percentuais e total corretamente

3) Integrar polling remoto com react-query | Criar `usePollRemote` com refetch adaptativo (5s live / 30s agendado) e backoff em 429 | 5h | Resultados globais atualizam sem recarregar pagina

4) Criar API helper e fallback seguro | Criar `pollApi.js` com `postVote/getResults` e fallback `null` quando API nao configurada | 3h | Modo local segue funcionando sem endpoint remoto

5) Exemplo serverless com anti-fraude basica | Criar funcao Node com validacao, dedupe por clientId e rate limit por IP | 6h | Endpoints GET/POST/DELETE retornam status corretos, incluindo 429

6) QA + E2E do fluxo completo | Cobrir voto, troca, limpar, persistencia e exibicao de resultados | 7h | Cypress valida fluxo principal e nao ha regressao visual no card

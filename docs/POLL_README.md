# Poll Feature README (Previsao da Torcida)

## 1. Modos de operacao

- `local` (padrao): votos persistidos no navegador com localForage.
- `remote`: votos agregados por API serverless (global), com fallback local para estado do usuario.

## 2. Variaveis de ambiente

No arquivo `.env`:

```bash
VITE_POLL_MODE=local
VITE_POLL_LANG=pt
# quando modo remoto:
VITE_POLL_API_BASE_URL=https://seu-dominio.com/api
```

## 3. Estrutura criada

- `src/components/poll/PollWidget.jsx`
- `src/components/poll/PollResults.jsx`
- `src/hooks/usePollLocal.js`
- `src/hooks/usePollRemote.js`
- `src/services/pollApi.js`
- `src/services/pollStorage.js`
- `src/utils/pollUtils.js`

## 4. Integracao no card de jogo

`MatchCard` ja possui botao `Previsao da torcida` que abre o widget por partida.

## 5. Migrar votos locais para server

A funcao `migrateLocalVotesToRemote` ja existe em `pollStorage.js`.

Exemplo:

```js
import { migrateLocalVotesToRemote } from "../services/pollStorage";
import { postVote } from "../services/pollApi";

await migrateLocalVotesToRemote((matchId, choice, clientId) =>
  postVote(matchId, choice, clientId)
);
```

## 6. Deploy serverless (Vercel/Netlify)

Use o arquivo `serverless-example/polls-serverless.js` como base.

Endpoints esperados:

- `POST /polls/:matchId/vote` body `{ choice, clientId }`
- `DELETE /polls/:matchId/vote` body `{ clientId }`
- `GET /polls/:matchId/results`

## 7. Nota legal e privacidade

- Pesquisa nao oficial.
- Nao coletar PII (email, nome, telefone) sem consentimento explicito.
- Se aplicar rate limit por IP, manter retencao minima e informar no aviso de privacidade.
- Em modo local, resultados representam apenas este navegador.

## 8. Mockups de estados (ASCII)

### Antes de votar

```text
[ Previsao da torcida ]
Brasil  [Votar]
Empate  [Votar]
Franca  [Votar]
0 votos
```

### Depois de votar

```text
Voce ja votou (14:30)
Brasil  65% [########.....]
Empate  10% [##...........]
Franca  25% [#####........]
12 votos
[Limpar voto] [WhatsApp] [Twitter]
```

### Rate limit (429)

```text
Muitas tentativas. Aguarde alguns segundos para votar novamente.
```

### Offline

```text
Sem conexao. Mostrando ultimo estado local.
```

## 9. Criticos de UX incluidos

- Ordem das opcoes: Home, Empate, Away.
- Cores distintas para barras.
- Total de votos com pluralizacao.
- Mensagem explicativa em client-only.
- Bloqueio automatico apos fim estimado da partida (2h apos kickoff).
- Microinteracao de voto (scale curto no botao selecionado).

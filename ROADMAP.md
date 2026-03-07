# Roadmap de Melhorias - GameGrid Copa 2026

## Onda 1 (MVP - alta prioridade)

1. Timezone do usuario
- Converter horario da partida para timezone local.
- Exibir timezone detectado na interface.

2. Favoritos locais
- Favoritar jogos e selecoes.
- Persistir em `localStorage` (ja pronto).
- Filtro `Meus favoritos`.

3. Barra de filtros
- Filtros por selecao, fase, data e status.
- Aplicacao de filtros no cliente com cache.

4. Link de estadio no mapa
- Abrir via Google Maps Search URL.

5. Contador regressivo
- Countdown para o proximo jogo.

6. Tabela de grupos
- Pontos, jogos, vitorias, empates, derrotas e saldo.

## Onda 2 (medio prazo)

1. Traducao automatica
- PT padrao + EN + ES.
- Traduzir estadio, cidade e textos de UI.

2. Atualizacao automatica
- Polling de jogos a cada 60s (ja preparado no hook).

3. Compartilhamento
- WhatsApp, Twitter, Facebook por partida.

4. Pagina de selecao (aprofundada)
- Escudo, pais, proximos jogos e ultimos resultados.

## Onda 3 (avancado)

1. Estatisticas detalhadas de jogo
- Gols, chutes, posse e cartoes.

2. Pagina de estadio
- Dados do estadio + lista de jogos no local.

3. Notificacoes no navegador
- Inicio de jogo e eventos relevantes.

## Criterios de aceite

- Sem backend e sem banco.
- Dados somente de APIs externas.
- Favoritos persistidos localmente.
- Interface responsiva e de facil integracao.

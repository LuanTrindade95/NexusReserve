# Architecture Decision Records (ADR)

Cada decisão técnica relevante vira um bloco `## ADR-NN — título / Contexto / Decisão / Consequências`.

## ADR-01 — Monorepo + Docker

### Contexto
NexusReserve combina uma API Laravel, uma SPA Angular, serviços de dados, fila, realtime e documentação de arquitetura. A fundação precisa permitir evolução coordenada sem espalhar setup, CI e decisões entre repositórios distintos nesta fase inicial.

### Decisão
Adotar monorepo com `/backend`, `/frontend`, `/docker`, `docs/`, `README.md` e `docker-compose.yml`. O ambiente Docker sobe MySQL 8, Redis 7, backend Laravel em PHP 8.3, Reverb, Horizon e frontend Angular com Node.

### Consequências
O setup fica rastreável e executável a partir da raiz, reduzindo fricção para desenvolvimento e revisão. O acoplamento operacional entre frontend/backend fica explícito, mas o código permanece separado por camada e pode ser extraído no futuro se houver necessidade real.

## ADR-02 — Jest no lugar de Karma

### Contexto
Angular ainda pode nascer com configuração de Karma, mas o projeto precisa de feedback rápido, CI simples e uma base de testes compatível com evolução de componentes standalone.

### Decisão
Substituir Karma por Jest usando `jest-preset-angular`, mantendo Angular ESLint para lint e `tsc --noEmit` como validação de tipagem.

### Consequências
Os testes unitários rodam com menor custo operacional no CI e sem navegador real. Testes que dependam de comportamento de browser devem ser cobertos futuramente com Playwright, conforme previsto na visão do projeto.

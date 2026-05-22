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

## ADR-03 — State machine de reservas com log de status

### Contexto
O ciclo de vida de reservas tem transições de negócio explícitas e estados finais. Codificar isso como strings soltas espalharia regras em controllers/services futuros e dificultaria auditoria operacional.

### Decisão
Usar `spatie/laravel-model-states` para representar os estados `draft`, `pending`, `approved`, `rejected`, `checked_out`, `returned` e `cancelled`. Cada transição permitida usa uma classe de transição dedicada e grava `reservation_status_logs` com origem, destino, ator e nota.

### Consequências
As transições inválidas falham no domínio antes de qualquer camada de API. O histórico fica consultável sem depender apenas da auditoria genérica de modelo. Em contrapartida, novas transições exigem atualização explícita da configuração de estados e teste correspondente.

## ADR-04 — Índice composto para consulta de conflito

### Contexto
A regra central de conflito depende de buscar reservas por recurso, status e janela temporal. MySQL não oferece exclusion constraints nativas para impedir sobreposição de intervalos diretamente no schema.

### Decisão
Criar índice composto em `reservations(resource_id, status, starts_at, ends_at)` para sustentar a futura query de conflito. A validação transacional com `lockForUpdate` será implementada na fase de regra de conflito, conforme a visão do projeto.

### Consequências
A estrutura já favorece o caminho de consulta crítico sem antecipar a regra de conflito. A integridade contra corrida ainda dependerá da implementação de domínio/aplicação com transação e lock no recurso.

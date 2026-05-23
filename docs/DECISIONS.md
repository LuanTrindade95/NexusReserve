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

## ADR-05 — Sanctum token SPA e formato de erro padrão

### Contexto
A SPA Angular precisa consumir uma API versionada com autenticação simples, RBAC por permissões e respostas de erro previsíveis. O projeto ainda não exige OAuth completo nem integração externa de identidade.

### Decisão
Usar Laravel Sanctum com tokens Bearer emitidos por `/api/v1/auth/login`, protegendo rotas com `auth:sanctum` e permissões Spatie via middleware `permission:`. Padronizar erros JSON em `/api/*` como `{ message, code, errors? }`, com status HTTP corretos para autenticação, autorização, validação, não encontrado e erro interno.

### Consequências
O frontend recebe um contrato estável para login, sessão atual e tratamento de falhas. A autorização permanece declarativa por middleware/policies e aproveita as permissões seedadas. Tokens Bearer simplificam o MVP, mas exigem cuidado no armazenamento client-side e podem evoluir para fluxo cookie-based se a estratégia de segurança do SPA mudar.

## ADR-06 — Controller fino com Service, DTO e API Resource

### Contexto
Os CRUDs de tipos de recurso e recursos são a primeira superfície administrativa da API. Eles precisam validar entrada, aplicar RBAC, compor filtros e expor contratos estáveis sem transformar controllers em pontos de regra de negócio.

### Decisão
Adotar o fluxo `Controller -> Service -> Model`, usando Form Requests para validação/autorização de entrada, `spatie/laravel-data` como DTO entre controller e service, e API Resources para serialização de saída. Escritas ficam protegidas por `resources.manage`; leitura exige autenticação; auditoria de recurso exige `audit.view`.

### Consequências
Controllers ficam finos e previsíveis, services concentram regras de persistência/filtros e o contrato JSON permanece separado dos models. A abordagem adiciona alguns arquivos por recurso, mas mantém a API preparada para regras futuras sem antecipar a lógica de reservas/conflitos.

## ADR-07 — Detecção de conflito via transação e lockForUpdate

### Contexto
A disponibilidade de um recurso é o ponto crítico do domínio: duas reservas bloqueantes não podem ocupar a mesma janela e reservas não podem sobrepor janelas de bloqueio. MySQL não oferece exclusion constraint nativa para intervalos como PostgreSQL com GiST/exclusion constraints, então a consistência precisa ser garantida pela aplicação dentro de uma transação.

### Decisão
Aplicar a checagem de disponibilidade no `ReservationService::create()`, dentro de uma transação. O serviço bloqueia a linha do recurso com `lockForUpdate`, valida duração máxima do `ResourceType`, consulta reservas em `pending`, `approved` e `checked_out`, consulta `resource_blackouts` e só então cria a reserva já em `pending` ou `approved` quando o tipo não exige aprovação. Conflitos retornam `409` com `code: reservation.conflict`.

### Consequências
O backend permanece fonte de verdade para disponibilidade e reduz corrida entre criações concorrentes do mesmo recurso. A garantia depende de todas as operações que criam estados bloqueantes passarem pelo serviço transacional. O teste de concorrência usa MySQL real e prova que duas criações simultâneas para o mesmo slot resultam em uma única reserva persistida.

## ADR-08 — Semântica de sobreposição com intervalo meio-aberto

### Contexto
Reservas usam janelas temporais com início inclusivo e fim exclusivo. Sem uma regra explícita, reservas adjacentes poderiam ser tratadas como conflito ou não conflito de forma inconsistente entre backend e frontend.

### Decisão
Adotar a semântica de intervalo meio-aberto `[starts_at, ends_at)`. A sobreposição é verdadeira quando `new.starts_at < existing.ends_at` e `new.ends_at > existing.starts_at`. Assim, uma reserva que termina às 10:00 e outra que começa às 10:00 não conflitam.

### Consequências
A regra fica simples, indexável e adequada para calendários operacionais. O frontend pode exibir disponibilidade com a mesma semântica, mas o backend continua sendo a fonte de verdade.

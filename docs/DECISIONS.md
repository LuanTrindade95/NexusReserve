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

## ADR-09 — Token em memória sem persistência local

### Contexto
A SPA precisa autenticar contra `/api/v1/auth` sem expor credenciais ou tokens em armazenamento persistente do navegador. `localStorage` e `sessionStorage` são simples, mas ampliam o impacto de XSS porque mantêm o token acessível por JavaScript após reloads.

### Decisão
Manter o token Sanctum Bearer somente em memória dentro do `AuthService`. O usuário autenticado também vive em signal no runtime da aplicação. Um reload limpa a sessão client-side e exige novo login. Interceptors funcionais leem o token exclusivamente do `AuthService`.

### Consequências
A estratégia reduz persistência indevida de token sensível e simplifica o MVP. A troca é menor conveniência em refresh de página. Se o produto exigir sessão persistente, a evolução preferida é cookie HTTP-only/SameSite com fluxo Sanctum cookie-based, não token em `localStorage`.

## ADR-10 — Estado de frontend com Angular Signals, sem NgRx

### Contexto
O frontend ainda está na fundação: auth, loading, toast, guards e shell. O estado global é pequeno, fortemente local ao runtime e não exige event sourcing, cache normalizado ou workflows complexos de reducers/effects.

### Decisão
Usar Angular Signals nos serviços centrais (`AuthService`, `LoadingService`, `ToastService`) e guards/interceptors funcionais. Não introduzir NgRx nesta fase.

### Consequências
O estado fica simples, tipado e direto para componentes standalone. Menos boilerplate acelera evolução sem prejudicar testabilidade. Se fluxos futuros de reservas exigirem cache complexo, optimistic updates ou sincronização realtime ampla, a decisão pode ser revisitada com escopo concreto.

## ADR-11 — Filtros como estado na URL

### Contexto
As telas operacionais de recursos e reservas precisam permitir revisão, compartilhamento e retomada de listas filtradas sem depender de estado invisível no componente. Filtros locais apenas em signals seriam rápidos, mas frágeis para navegação, refresh e suporte.

### Decisão
Persistir filtros, paginação e recortes principais em query params, sincronizando `ActivatedRoute.queryParamMap` com signals e controles de formulário. As telas continuam usando signals para renderização local, mas a URL é o contrato de navegação.

### Consequências
Links de listas filtradas ficam reproduzíveis e o usuário pode usar voltar/avançar do navegador com previsibilidade. A implementação exige cuidado para evitar loops de sincronização, mas mantém a experiência coerente com painéis administrativos maduros.

## ADR-12 — UI sugere conflito, backend decide

### Contexto
O formulário de criação de reserva deve avisar conflitos antes do envio para reduzir tentativa e erro. Porém a regra central depende de transação, `lockForUpdate`, reservas bloqueantes e blackouts, portanto não pode ser delegada ao frontend.

### Decisão
Implementar no Angular uma checagem de disponibilidade apenas como dica de UX, consultando reservas visíveis e blackouts do recurso selecionado. O submit sempre chama a API e trata `409 reservation.conflict` como resposta autoritativa do backend.

### Consequências
O usuário recebe feedback antecipado, mas a consistência continua protegida pela engine transacional da API. Pode haver diferença entre sugestão local e decisão final em cenários de concorrência ou dados recém-alterados; nesses casos a mensagem do backend prevalece.

## ADR-13 — Reverb com canais privados e presence autorizados

### Contexto
Reservas e disponibilidade precisam atualizar a operação sem refresh, mas os eventos carregam dados sensíveis de agenda, recurso e usuário. Canais abertos vazariam estado operacional entre perfis sem permissão.

### Decisão
Usar Laravel Reverb com Echo/Pusher no Angular. Eventos de status entram em canais privados do dono (`users.{id}`), do recurso (`resources.{id}`) e em um canal presence de gestores (`managers.reservations`). A autorização dos canais usa Sanctum e permissões Spatie: dono acessa apenas seu canal, gestores/admins acessam canais operacionais conforme `reservations.view-all`, `resources.manage` ou `reservations.approve`.

### Consequências
O realtime segue o mesmo modelo de RBAC da API e evita broadcast público de reservas. A UI atualiza via signals quando eventos chegam e mantém reconciliação leve por polling para degradar sem quebrar a tela caso o WebSocket caia ou perca evento.

## ADR-14 — Notificações via fila e database channel

### Contexto
Criação, aprovação e rejeição de reservas disparam mensagens para gestores e solicitantes. Essas notificações não devem bloquear a transição de estado nem depender de o usuário estar conectado no momento.

### Decisão
Usar Laravel Notifications com canais `database` e `broadcast`, processadas por Redis/Horizon. Reservas pendentes notificam usuários com `reservations.approve`; decisões `approved`/`rejected` notificam o dono. A API `/api/v1/notifications` lista notificações e permite marcar uma ou todas como lidas.

### Consequências
O sino do frontend combina histórico persistente com push em tempo real. Horizon absorve o trabalho assíncrono e a notificação permanece disponível após reconnect/reload controlado, ao custo de exigir Redis/Horizon saudáveis no ambiente Docker.

## ADR-15 — CORS explícito para autenticação de canais Reverb

### Contexto
O Echo autentica canais privados e presence por `POST /broadcasting/auth`, fora do prefixo `/api/*`. A política CORS anterior cobria apenas a API versionada e `sanctum/csrf-cookie`, então o navegador bloqueava a autenticação do canal a partir de `http://localhost:4200` antes que Sanctum pudesse validar o token Bearer.

### Decisão
Incluir `broadcasting/auth` em `config/cors.php`, mantendo `supports_credentials=true`, os origins controlados por `FRONTEND_URL`/localhost e os headers necessários para `Authorization: Bearer`. O frontend continua usando o endpoint derivado de `API_BASE_URL` e enviando o token em `auth.headers.Authorization`.

### Consequências
O handshake WebSocket continua separado da autorização HTTP dos canais, mas o preflight CORS passa para o origin do SPA. A autenticação real permanece em `routes/channels.php` com Sanctum e RBAC; CORS apenas permite que o navegador faça a requisição.

## ADR-16 — Listener síncrono, notificações enfileiradas

### Contexto
`ReservationStatusChanged` é o evento de domínio emitido quando um log de status é criado. O listener que escolhe destinatários também estava enfileirado, enquanto as próprias notificações já implementavam `ShouldQueue`. Em ambiente Docker com Redis, isso criava uma fila em duas etapas: o evento chegava ao dispatcher, mas o handler do listener não executava no mesmo processo, atrasando ou ocultando o envio esperado das notificações.

### Decisão
Manter a emissão do evento no ponto em que o status log é criado e executar `QueueReservationStatusNotification` de forma síncrona. O listener apenas decide destinatários e chama `notify`; o trabalho assíncrono permanece nas notificações `ReservationPendingApprovalNotification` e `ReservationDecisionNotification`, que continuam enfileiradas pelo Laravel Notifications.

### Consequências
Qualquer transição por state machine aciona imediatamente a escolha de destinatários sem duplicar dispatch de evento. A entrega pesada continua fora do request via fila de notificações, e os testes conseguem observar o envio sem depender de um worker externo para processar o listener.

## ADR-17 — Hardening HTTP e rate limiting por superfície sensível

### Contexto
O projeto já possuía autenticação, RBAC e erro JSON padronizado, mas a fase de portfólio exige demonstrar postura operacional mínima: headers de segurança, limites de abuso em rotas sensíveis e proteção explícita do handshake realtime.

### Decisão
Adicionar middleware global de headers (`nosniff`, `DENY`, referrer policy, permissions policy e HSTS quando HTTPS estiver ativo). Definir rate limiters para login, rotas mutáveis e `/broadcasting/auth`, aplicando limites por IP ou usuário autenticado.

### Consequências
A API reduz superfície para clickjacking, sniffing e abuso básico sem introduzir infraestrutura externa. Os limites são conservadores para o MVP e podem evoluir para políticas por plano, tenant ou gateway quando o produto exigir.

## ADR-18 — Build Docker de produção separado por processo

### Contexto
O Docker de desenvolvimento usa servidores convenientes para feedback rápido. Para apresentação sênior, o projeto precisa mostrar um caminho operacional mais próximo de produção, com assets estáticos compilados, PHP-FPM otimizado e processos longos separados.

### Decisão
Criar `docker-compose.prod.yml` com Angular build multi-stage servido por Nginx, Laravel em PHP-FPM, Nginx separado para API, Horizon como worker, Reverb como servidor websocket, MySQL e Redis persistidos em volumes nomeados. Segredos de produção são exigidos por variável de ambiente e documentados em `.env.production.example`.

### Consequências
O perfil de produção fica mais próximo de um deploy real e evita depender de `ng serve` ou `php artisan serve`. A composição ainda é simples o suficiente para portfólio e demonstra separação de responsabilidades, cache/opcache e injeção externa de segredos.

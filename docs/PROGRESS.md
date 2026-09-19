# Progress

> Legenda: ✓ auditada = validada empiricamente neste chat (número/evidência citados).
> ⏳ a auditar = construída mas ainda sem evidência empírica validada.
> ⏳ pendente = não iniciada.

| Fase | Status | Evidência |
|---|---|---|
| Fase 0 — Visão e documentação base | ✓ auditada | 3f9705a — VISION/DECISIONS/PROGRESS criados; 14 ADRs presentes e consistentes |
| Fase 1 — Fundação (scaffold + Docker + CI) | ✓ auditada | 81f769d + CI run #8 Success (Backend 23s / Frontend 54s); main com 53 commits; 4 PRs merjados rastreáveis. Ressalvas menores: CI on:push (não PR); fix ci:quote-null-broadcast sem ADR |
| Fase 2 — Domínio e Dados | ✓ auditada | ab48688 — migrate:fresh+seed verde (14 mig/2 seed); counts ok (25 res/40 resv/74 logs/6 blackouts); Pest state machine 2/2; pint 129 PASS |
| Fase 3A — Auth API + RBAC | ✓ auditada | d6ebc6e — Pest AuthApi 6/6 (23 assert); smoke /me HTTP 200 com roles/permissions sem vazar credencial; erro padrão ADR-05 confirmado |
| Fase 3B — CRUD Recursos & Tipos | ✓ auditada | a2c59a8 — Pest ResourceApi 7/7 (39 assert); smoke HTTP create 201 + list ?status=active paginado (21/26 active); API Resource sem vazamento |
| Fase 3C — Engine de Reservas e conflito | ✓ auditada | c99a19c — Pest ReservationApi 11/11 (52 assert); smoke 409 HTTP real (code reservation.conflict); TESTE DE CONCORRÊNCIA 1/1 (4 assert, 1.92s, pcntl_fork + lockForUpdate, prova exclusividade: só 1 reserva persiste). ADR-07/08 confirmados |
| Fase 4A — Frontend: fundação (shell/auth/guards/interceptors) | ✓ auditada | 7be772a — Jest AuthService + errorInterceptor(401) + permissionGuard 3/3 nominais (suite total 9/9); tsc limpo + build com chunks login/shell (Fase 1). ADR-09/10 confirmados. Ressalva mínima: smoke visual de login não capturado |
| Fase 4B — Frontend: recursos & reservas | ✓ auditada | 7621a99 — Jest 3/3 features (409, filtros-URL, transições); smoke UI: POST /reservations 409 reservation.conflict tratado em toast+inline+painel (Network confirma payload idêntico ao backend 3C); dashboard/KPIs/brand kit ok. ADR-11/12 confirmados |
| Fase 5 — Realtime + Notificações | ✓ auditada | 58b7f36+1cd734e+91ea8cc — Pest RealtimeNotification 4/4; não-regressão 13/13; CORS /broadcasting/auth preflight 204; WS Reverb conectado (101, X-Powered-By: Laravel Reverb); CORS error eliminado do console; notificação ao vivo confirmada em teste manual. ADR-13/14 + correções |
| Fase 6 — Polish & Vitrine | ✓ auditada | d5424a2 + CI #13 Success (Backend 22s/Frontend 56s no main); npm ci limpo (1594 pkgs); lint/Jest 9/9/build verdes; Pest 32p+1skip 84.5% cov; Playwright 3/3; composer audit limpo; Docker prod 200/200; Lighthouse landing 98/92/100, app 100/100/95; README com 3 screenshots reais (confirmados em disco) |
| Projeto v1 | ✓ completo | NexusReserve v1 completo como peça de portfólio sênior; README estratégico, screenshots reais, ADRs finais e deploy Docker documentados |
| Correção pós-v1 — layout do filtro de busca | ✓ auditada | 3d9dc50 — busca em /resources e /reservations não encolhe (antes 50px; mín. medido 258px) nem estoura o card; lupa centralizada (Δ 0px) em 375/768/1024/1280/1440 × sidebar expandida/recolhida; filtros/URL/Apply/Clear inalterados; lint/build verdes; Jest 7/7 suites, 9/9 testes |

## Problemas conhecidos

- `npm run test` (Jest) não encontra testes quando o checkout está dentro de uma pasta cujo nome começa com ponto (ex.: worktrees em `.claude/worktrees/`): o `testMatch` resolve 0 arquivos. Em checkout comum e na CI roda normalmente. Contorno local: rodar o Jest com um config que troque `testMatch` por `testRegex` equivalente, sem alterar os testes.

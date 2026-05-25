# Progress

> Legenda: ✓ auditada = validada empiricamente neste chat (número/evidência citados).
> ⏳ a auditar = construída mas ainda sem evidência empírica validada.
> ⏳ pendente = não iniciada.

| Fase | Status | Evidência |
|---|---|---|
| Fase 0 — Visão e documentação base | ✓ auditada | 3f9705a — VISION/DECISIONS/PROGRESS criados; 14 ADRs presentes e consistentes |
| Fase 1 — Fundação (scaffold + Docker + CI) | ⚠️ auditada c/ ressalva | e96a07a — build Angular ok, tsc --noEmit limpo, stack up/healthy, pint 129 PASS. RESSALVA: ci.yml existe, mas a validação definitiva deve ocorrer no PR. |
| Fase 2 — Domínio e Dados | ✓ auditada | ab48688 — migrate:fresh+seed verde (14 mig/2 seed); counts ok (25 res/40 resv/74 logs/6 blackouts); Pest state machine 2/2; pint 129 PASS |
| Fase 3A — Auth API + RBAC | ✓ auditada | d6ebc6e — Pest AuthApi 6/6 (23 assert); smoke /me HTTP 200 com roles/permissions sem vazar credencial; erro padrão ADR-05 confirmado |
| Fase 3B — CRUD Recursos & Tipos | ✓ auditada | a2c59a8 — Pest ResourceApi 7/7 (39 assert); smoke HTTP create 201 + list ?status=active paginado (21/26 active); API Resource sem vazamento |
| Fase 3C — Engine de Reservas e conflito | ✓ auditada | c99a19c — Pest ReservationApi 11/11 (52 assert); smoke 409 HTTP real (code reservation.conflict); TESTE DE CONCORRÊNCIA 1/1 (4 assert, 1.92s, pcntl_fork + lockForUpdate, prova exclusividade: só 1 reserva persiste). ADR-07/08 confirmados |
| Fase 4A — Fundação frontend Angular e auth shell | ✓ concluída | 0926df4 |
| Fase 4B — Telas de domínio frontend | ✓ concluída | 8ec1b79 |
| Fase 5 — Realtime e notificações | ✓ concluída | e039138 |
| Fase 07 — Frontend SPA e UX enterprise | ⏳ pendente | — |
| Fase 08 — Testes, documentação final e hardening | ⏳ pendente | — |

# VISION — NexusReserve

## Visão Geral
Plataforma corporativa de gestão de reservas de recursos internos (salas, veículos, equipamentos, notebooks). Permite que colaboradores solicitem reservas, gestores aprovem/rejeitem, e administradores gerenciem recursos — com controle de disponibilidade em tempo real, detecção de conflitos, RBAC e auditoria completa. É um projeto de portfólio que deve transmitir senioridade: arquitetura limpa, regras de negócio reais, rastreabilidade.

## Problema
Empresas controlam reservas de recursos em planilhas/e-mail, gerando conflitos (duas pessoas, mesma sala, mesmo horário), falta de rastreabilidade e zero auditoria. NexusReserve centraliza isso com fluxo de aprovação e disponibilidade em tempo real.

## Escopo do MVP
DENTRO: auth + RBAC; CRUD de tipos de recurso e recursos; ciclo de reserva completo (rascunho → pendente → aprovada/rejeitada → retirada → devolvida → cancelada); detecção de conflito de horário; janelas de bloqueio/manutenção; auditoria de alterações; disponibilidade em tempo real (WebSocket); dashboard administrativo; landing page.
FORA (v2): billing, multi-empresa/multi-tenant, mobile nativo, relatórios exportáveis avançados.

## Stack Técnica
| Camada | Tecnologia | Justificativa |
|---|---|---|
| Backend | Laravel 12 / PHP 8.3 | Maturidade, ecossistema, demonstra padrões enterprise |
| API | REST versionada /api/v1 + API Resources | Contrato claro e estável para o SPA |
| Auth | Laravel Sanctum (SPA token) | Padrão para SPA + Laravel, sem overhead de OAuth |
| RBAC | spatie/laravel-permission | Padrão de mercado, roles + permissions granulares |
| State machine | spatie/laravel-model-states | Transições de reserva explícitas e validadas |
| Auditoria | owen-it/laravel-auditing | Histórico de alterações por modelo |
| DTOs | spatie/laravel-data | Tipagem forte entre camadas |
| Banco | MySQL 8 | Relacional, transações, locks para concorrência |
| Cache/Filas | Redis + Laravel Queue (Horizon) | Notificações assíncronas, cache de disponibilidade |
| Realtime | Laravel Reverb + Echo | WebSocket first-party, disponibilidade ao vivo |
| Frontend | Angular 19 (standalone, signals, @if/@for) | SPA moderna, reactive forms, guards, interceptors |
| Estilização | TailwindCSS | Brand kit enterprise (ver abaixo) |
| Testes | Pest (backend) · Jest + Playwright (frontend) | Funcional + E2E |
| Infra | Docker Compose | Sobe stack inteira com um comando |

## Entidades de Domínio (schema mental)
- **User**: name, email, password, department_id?. Roles via spatie.
- **Role / Permission**: super-admin, admin, manager, requester. Permissions: resources.manage, reservations.approve, reservations.create, reservations.view-all, audit.view.
- **Department**: name (escopo organizacional opcional).
- **ResourceType**: name, slug, icon, requires_approval(bool), max_duration_minutes, color.
- **Resource**: resource_type_id, name, code(unique), description, location, capacity?, status(active|maintenance|retired), metadata(json). SoftDeletes + Auditable.
- **Reservation**: resource_id, user_id, starts_at, ends_at, status(draft|pending|approved|rejected|checked_out|returned|cancelled), purpose, approved_by?, approved_at?, rejection_reason?, cancelled_at?. SoftDeletes + Auditable + state machine.
- **ReservationStatusLog**: reservation_id, from_status, to_status, changed_by, note, created_at.
- **ResourceBlackout**: resource_id, starts_at, ends_at, reason (bloqueio/manutenção que impede reserva).

## Regra central de conflito
Um recurso NÃO pode ter duas reservas com status em (pending, approved, checked_out) cujos intervalos [starts_at, ends_at) se sobreponham, nem sobrepor um ResourceBlackout. Checagem dentro de transação com `lockForUpdate` no recurso para evitar corrida (MySQL não tem exclusion constraint nativa — decisão a registrar em ADR).

## Mapa de funcionalidades
Core: auth/RBAC · CRUD recursos+tipos · criar/editar reserva · detecção de conflito · aprovação/rejeição · check-out/devolução · janelas de bloqueio · auditoria · disponibilidade realtime · dashboard.
Importante: filtros persistentes na URL · calendário de disponibilidade · notificações in-app.
Nice-to-have: dark mode · export CSV · métricas de uso por recurso.

## Mapa de telas
/login · /dashboard (KPIs + próximas reservas) · /resources (lista+filtros) · /resources/:id · /reservations (lista+filtros+calendário) · /reservations/new · /reservations/:id · /admin/resource-types · /admin/audit · / (landing page pública).

## Brand kit (frontend)
Cores: Midnight Blue #0F172A, Slate #1E293B, Enterprise Cyan #06B6D4; Surface #F8FAFC, Border #E2E8F0; Success #10B981, Warning #F59E0B, Danger #EF4444, Info #3B82F6. Fontes: Inter (principal), Plus Jakarta Sans (display). Estilo: clean enterprise, rounded-lg, sombras suaves, ícones lucide outline. Referências: Linear, Notion Enterprise, Jira Service Management.

## Riscos técnicos
- Concorrência de reservas (mitigação: transação + lockForUpdate + teste de corrida).
- Drift entre validação de conflito no backend e UI (mitigação: backend é fonte de verdade, UI só sugere).
- Reverb em Docker (mitigação: porta + configs validadas com smoke test de broadcast).

---

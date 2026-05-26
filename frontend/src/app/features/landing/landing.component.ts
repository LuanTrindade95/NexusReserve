import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Activity,
  Boxes,
  CalendarClock,
  CheckCircle2,
  Database,
  GitBranch,
  Layers3,
  LockKeyhole,
  RadioTower,
  ServerCog,
  ShieldCheck,
  Workflow,
} from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';

interface FeatureItem {
  title: string;
  body: string;
  icon: typeof ShieldCheck;
}

interface StackItem {
  label: string;
  detail: string;
}

@Component({
  selector: 'app-landing',
  imports: [LucideAngularModule, RouterLink],
  template: `
    <main class="min-h-screen bg-surface text-midnight-blue">
      <section class="relative overflow-hidden bg-midnight-blue text-white">
        <div class="mx-auto grid min-h-[92vh] max-w-7xl content-between px-6 py-6 sm:px-8 lg:px-10">
          <nav class="flex items-center justify-between">
            <a class="flex items-center gap-3" routerLink="/">
              <span class="grid h-10 w-10 place-items-center rounded-lg bg-enterprise-cyan font-display text-lg font-extrabold text-white">N</span>
              <span class="font-display text-lg font-extrabold">NexusReserve</span>
            </a>
            <a
              class="inline-flex h-10 items-center rounded-lg border border-white/15 px-4 text-sm font-bold text-white transition hover:bg-white/10"
              routerLink="/login"
            >
              Open console
            </a>
          </nav>

          <div class="grid items-center gap-10 py-12 lg:grid-cols-[0.92fr_1.08fr]">
            <div class="max-w-3xl">
              <p class="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-cyan-100">
                <lucide-angular [img]="radioIcon" [size]="16" />
                Realtime resource operations
              </p>
              <h1 class="font-display text-5xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
                Centralize recursos. Simplifique operações.
              </h1>
              <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Uma plataforma corporativa para controlar salas, veículos e equipamentos com aprovação, auditoria, RBAC e disponibilidade em tempo real.
              </p>
              <div class="mt-8 flex flex-wrap gap-3">
                <a class="inline-flex h-12 items-center rounded-lg bg-enterprise-cyan px-5 text-sm font-extrabold text-midnight-blue shadow-soft transition hover:bg-cyan-300" routerLink="/login">
                  Explore the demo
                </a>
                <a class="inline-flex h-12 items-center rounded-lg border border-white/15 px-5 text-sm font-extrabold text-white transition hover:bg-white/10" href="#architecture">
                  View architecture
                </a>
              </div>
            </div>

            <div class="rounded-lg border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur">
              <img
                class="aspect-[16/10] w-full rounded-lg border border-white/10 object-cover"
                src="assets/portfolio/dashboard.png"
                alt="NexusReserve dashboard screenshot"
                width="1024"
                height="720"
                decoding="async"
                fetchpriority="high"
              />
              <div class="mt-4 grid grid-cols-3 gap-3 text-sm">
                <span class="rounded-lg bg-white/10 p-3 font-semibold text-slate-200">Conflict locks</span>
                <span class="rounded-lg bg-white/10 p-3 font-semibold text-slate-200">Audit trail</span>
                <span class="rounded-lg bg-white/10 p-3 font-semibold text-slate-200">Live updates</span>
              </div>
            </div>
          </div>

          <div class="grid gap-3 pb-3 sm:grid-cols-3">
            <div class="rounded-lg border border-white/10 bg-white/5 p-4">
              <p class="text-3xl font-extrabold">409</p>
              <p class="mt-1 text-sm text-slate-300">Conflitos tratados como regra de domínio, não como erro genérico.</p>
            </div>
            <div class="rounded-lg border border-white/10 bg-white/5 p-4">
              <p class="text-3xl font-extrabold">RBAC</p>
              <p class="mt-1 text-sm text-slate-300">Permissões granulares para gestão, aprovação, auditoria e leitura.</p>
            </div>
            <div class="rounded-lg border border-white/10 bg-white/5 p-4">
              <p class="text-3xl font-extrabold">WS</p>
              <p class="mt-1 text-sm text-slate-300">Reverb, canais privados e notificações persistentes.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <div class="max-w-3xl">
          <p class="text-sm font-bold uppercase tracking-wide text-enterprise-cyan">Operational depth</p>
          <h2 class="mt-3 font-display text-3xl font-extrabold text-midnight-blue sm:text-4xl">Mais que CRUD: regras de negócio reais.</h2>
        </div>
        <div class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          @for (feature of features; track feature.title) {
            <article class="rounded-lg border border-border bg-white p-5 shadow-soft">
              <lucide-angular class="text-enterprise-cyan" [img]="feature.icon" [size]="26" />
              <h3 class="mt-4 font-display text-lg font-extrabold text-midnight-blue">{{ feature.title }}</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">{{ feature.body }}</p>
            </article>
          }
        </div>
      </section>

      <section id="architecture" class="border-y border-border bg-white">
        <div class="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
          <div class="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p class="text-sm font-bold uppercase tracking-wide text-enterprise-cyan">Architecture</p>
              <h2 class="mt-3 font-display text-3xl font-extrabold text-midnight-blue sm:text-4xl">Camadas isoladas, eventos explícitos e consistência transacional.</h2>
              <p class="mt-4 text-base leading-7 text-slate-600">
                O backend mantém a disponibilidade como fonte de verdade com transações e lockForUpdate. O frontend só sugere conflitos para UX, enquanto eventos e filas mantêm os operadores sincronizados.
              </p>
            </div>

            <div class="rounded-lg border border-border bg-surface p-5 shadow-soft">
              <div class="grid gap-3">
                <div class="grid gap-3 md:grid-cols-3">
                  <div class="rounded-lg bg-white p-4 text-center font-bold shadow-sm">Angular SPA</div>
                  <div class="rounded-lg bg-white p-4 text-center font-bold shadow-sm">REST /api/v1</div>
                  <div class="rounded-lg bg-white p-4 text-center font-bold shadow-sm">Laravel Domain</div>
                </div>
                <div class="grid grid-cols-3 items-center gap-3 text-center text-enterprise-cyan">
                  <span class="h-0.5 bg-enterprise-cyan"></span>
                  <lucide-angular class="mx-auto" [img]="workflowIcon" [size]="28" />
                  <span class="h-0.5 bg-enterprise-cyan"></span>
                </div>
                <div class="grid gap-3 md:grid-cols-4">
                  <div class="rounded-lg border border-border bg-white p-4">
                    <lucide-angular [img]="databaseIcon" [size]="22" />
                    <p class="mt-2 font-bold">MySQL locks</p>
                  </div>
                  <div class="rounded-lg border border-border bg-white p-4">
                    <lucide-angular [img]="activityIcon" [size]="22" />
                    <p class="mt-2 font-bold">Redis queues</p>
                  </div>
                  <div class="rounded-lg border border-border bg-white p-4">
                    <lucide-angular [img]="radioIcon" [size]="22" />
                    <p class="mt-2 font-bold">Reverb WS</p>
                  </div>
                  <div class="rounded-lg border border-border bg-white p-4">
                    <lucide-angular [img]="gitIcon" [size]="22" />
                    <p class="mt-2 font-bold">ADR trace</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <div class="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div>
            <p class="text-sm font-bold uppercase tracking-wide text-enterprise-cyan">Screenshots</p>
            <h2 class="mt-3 font-display text-3xl font-extrabold text-midnight-blue">Interface operacional pronta para avaliação.</h2>
            <div class="mt-6 grid gap-4">
              <img class="rounded-lg border border-border shadow-soft" src="assets/portfolio/resources.png" alt="Resources table screenshot" width="1024" height="720" loading="lazy" decoding="async" />
              <img class="rounded-lg border border-border shadow-soft" src="assets/portfolio/reservation-detail.png" alt="Reservation detail screenshot" width="1024" height="720" loading="lazy" decoding="async" />
            </div>
          </div>
          <div class="rounded-lg border border-border bg-white p-5 shadow-soft">
            <h3 class="font-display text-xl font-extrabold">Stack visual</h3>
            <div class="mt-5 grid gap-3">
              @for (item of stack; track item.label) {
                <div class="flex items-center justify-between rounded-lg bg-surface p-4">
                  <span class="font-extrabold text-midnight-blue">{{ item.label }}</span>
                  <span class="text-sm font-semibold text-slate-500">{{ item.detail }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
  readonly activityIcon = Activity;
  readonly databaseIcon = Database;
  readonly gitIcon = GitBranch;
  readonly radioIcon = RadioTower;
  readonly workflowIcon = Workflow;

  readonly features: readonly FeatureItem[] = [
    {
      title: 'Reservas transacionais',
      body: 'Conflitos são bloqueados no backend com lock no recurso e intervalos meio-abertos.',
      icon: CalendarClock,
    },
    {
      title: 'Governança e RBAC',
      body: 'Aprovação, auditoria e gestão ficam isoladas por permissões reais, não flags no frontend.',
      icon: ShieldCheck,
    },
    {
      title: 'Realtime responsável',
      body: 'Canais privados e presence atualizam reservas e notificações sem abrir dados operacionais.',
      icon: RadioTower,
    },
    {
      title: 'Operação escalável',
      body: 'Redis, Horizon, DTOs, API Resources e ADRs mostram decisões rastreáveis para evolução.',
      icon: ServerCog,
    },
  ];

  readonly stack: readonly StackItem[] = [
    { label: 'Angular 19', detail: 'standalone + signals' },
    { label: 'Laravel 12', detail: 'REST + services' },
    { label: 'MySQL 8', detail: 'transactions + locks' },
    { label: 'Redis/Horizon', detail: 'queues + cache' },
    { label: 'Reverb', detail: 'private realtime' },
    { label: 'Docker', detail: 'dev and prod compose' },
  ];

  protected readonly lockIcon = LockKeyhole;
  protected readonly boxesIcon = Boxes;
  protected readonly layersIcon = Layers3;
  protected readonly checkIcon = CheckCircle2;
}

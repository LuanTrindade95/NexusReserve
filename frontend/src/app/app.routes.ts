import { Routes } from '@angular/router';
import { authGuard } from '@app/core/auth/auth.guard';
import { permissionGuard } from '@app/core/auth/permission.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('@app/features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('@app/features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('@app/layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('@app/features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'resources',
        loadComponent: () => import('@app/features/resource-management/resources-list/resources-list.component').then((m) => m.ResourcesListComponent),
      },
      {
        path: 'resources/:id',
        loadComponent: () => import('@app/features/resource-management/resource-detail/resource-detail.component').then((m) => m.ResourceDetailComponent),
      },
      {
        path: 'reservations',
        loadComponent: () => import('@app/features/reservations/reservations-list/reservations-list.component').then((m) => m.ReservationsListComponent),
      },
      {
        path: 'reservations/new',
        loadComponent: () => import('@app/features/reservations/reservation-create/reservation-create.component').then((m) => m.ReservationCreateComponent),
      },
      {
        path: 'reservations/:id',
        loadComponent: () => import('@app/features/reservations/reservation-detail/reservation-detail.component').then((m) => m.ReservationDetailComponent),
      },
      {
        path: 'admin/resource-types',
        canActivate: [permissionGuard('resources.manage')],
        loadComponent: () => import('@app/features/resource-management/resource-types-admin/resource-types-admin.component').then((m) => m.ResourceTypesAdminComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];

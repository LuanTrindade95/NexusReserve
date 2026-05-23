import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ApiResource } from '@app/core/api/pagination.models';
import { AuthService } from '@app/core/auth/auth.service';
import { ReservationDetailComponent } from '@app/features/reservations/reservation-detail/reservation-detail.component';
import { ReservationsApiService } from '@app/features/reservations/reservations-api.service';
import { Reservation } from '@app/features/reservations/reservations.models';
import { of } from 'rxjs';

describe('ReservationDetailComponent', () => {
  let fixture: ComponentFixture<ReservationDetailComponent>;
  let component: ReservationDetailComponent;
  const currentUser = signal({
    id: 4,
    name: 'Requester',
    email: 'requester@demo',
    department_id: 1,
    roles: ['requester'],
    permissions: ['reservations.create', 'reservations.approve'],
  });

  beforeEach(async () => {
    const api: Pick<ReservationsApiService, 'getReservation'> = {
      getReservation: () => of({ data: reservation('pending') } satisfies ApiResource<Reservation>),
    };
    const auth: Pick<AuthService, 'currentUser' | 'hasPermission'> = {
      currentUser,
      hasPermission: (permission: string) => currentUser().permissions.includes(permission),
    };

    await TestBed.configureTestingModule({
      imports: [ReservationDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '42' } } },
        },
        { provide: ReservationsApiService, useValue: api },
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows transition actions only when state and permissions allow them', () => {
    expect(fixture.nativeElement.querySelector('[data-testid="approve-action"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="checkout-action"]')).toBeNull();

    component.reservation.set(reservation('approved'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="approve-action"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="checkout-action"]')).not.toBeNull();

    currentUser.set({
      ...currentUser(),
      permissions: ['reservations.create'],
    });
    component.reservation.set(reservation('pending'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="approve-action"]')).toBeNull();
  });
});

function reservation(status: Reservation['status']): Reservation {
  return {
    id: 42,
    resource_id: 10,
    resource: null,
    user_id: 4,
    user: {
      id: 4,
      name: 'Requester',
      email: 'requester@demo',
      department_id: 1,
      roles: ['requester'],
      permissions: ['reservations.create'],
    },
    starts_at: '2026-06-25T09:00:00Z',
    ends_at: '2026-06-25T10:00:00Z',
    status,
    purpose: 'Planning',
    approved_by: null,
    approver: null,
    approved_at: null,
    rejection_reason: null,
    cancelled_at: null,
    status_logs: [],
    deleted_at: null,
    created_at: '2026-05-23T00:00:00Z',
    updated_at: '2026-05-23T00:00:00Z',
  };
}

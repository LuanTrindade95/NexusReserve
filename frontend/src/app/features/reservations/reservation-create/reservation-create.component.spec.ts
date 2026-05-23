import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ApiPage } from '@app/core/api/pagination.models';
import { Resource } from '@app/features/resource-management/resources.models';
import { ResourcesApiService } from '@app/features/resource-management/resources-api.service';
import { ReservationsApiService } from '@app/features/reservations/reservations-api.service';
import { ReservationCreateComponent } from '@app/features/reservations/reservation-create/reservation-create.component';
import { Reservation } from '@app/features/reservations/reservations.models';
import { of, throwError } from 'rxjs';

describe('ReservationCreateComponent', () => {
  let fixture: ComponentFixture<ReservationCreateComponent>;
  let component: ReservationCreateComponent;

  const resource: Resource = {
    id: 10,
    resource_type_id: 1,
    resource_type: {
      id: 1,
      name: 'Meeting rooms',
      slug: 'meeting-rooms',
      icon: 'building',
      requires_approval: true,
      max_duration_minutes: 240,
      color: '#06B6D4',
      created_at: '2026-05-23T00:00:00Z',
      updated_at: '2026-05-23T00:00:00Z',
    },
    name: 'Board Room',
    code: 'ROOM-10',
    description: null,
    location: 'HQ',
    capacity: 10,
    status: 'active',
    metadata: null,
    deleted_at: null,
    created_at: '2026-05-23T00:00:00Z',
    updated_at: '2026-05-23T00:00:00Z',
  };

  beforeEach(async () => {
    const resourcesApi: Pick<ResourcesApiService, 'listResources' | 'listBlackouts'> = {
      listResources: () => of({ data: [resource] } satisfies ApiPage<Resource>),
      listBlackouts: () => of({ data: [] } satisfies ApiPage<never>),
    };
    const reservationsApi: Pick<ReservationsApiService, 'listReservations' | 'createReservation'> = {
      listReservations: () => of({ data: [] } satisfies ApiPage<Reservation>),
      createReservation: () => throwError(() => new HttpErrorResponse({
        status: 409,
        error: {
          message: 'The resource already has a blocking reservation in this time window.',
          code: 'reservation.conflict',
        },
      })),
    };

    await TestBed.configureTestingModule({
      imports: [ReservationCreateComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
        { provide: ResourcesApiService, useValue: resourcesApi },
        { provide: ReservationsApiService, useValue: reservationsApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the backend conflict message when reservation creation returns 409', () => {
    component.form.setValue({
      resource_id: '10',
      starts_at: '2026-06-25T09:00',
      ends_at: '2026-06-25T10:00',
      purpose: 'Quarterly planning',
    });

    component.submit();
    fixture.detectChanges();

    expect(component.conflictMessage()).toContain('blocking reservation');
    expect(fixture.nativeElement.textContent).toContain('The resource already has a blocking reservation');
  });
});

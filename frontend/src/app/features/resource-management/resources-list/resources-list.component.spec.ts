import { convertToParamMap, provideRouter, Router } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ApiPage } from '@app/core/api/pagination.models';
import { AuthService } from '@app/core/auth/auth.service';
import { ResourcesApiService } from '@app/features/resource-management/resources-api.service';
import { Resource, ResourceType } from '@app/features/resource-management/resources.models';
import { ResourcesListComponent } from '@app/features/resource-management/resources-list/resources-list.component';

describe('ResourcesListComponent', () => {
  let fixture: ComponentFixture<ResourcesListComponent>;
  let component: ResourcesListComponent;
  let router: Router;

  beforeEach(async () => {
    const queryParamMap = new BehaviorSubject(convertToParamMap({
      search: 'room',
      type: '1',
      status: 'active',
      page: '2',
    }));
    const resourcesApi: Pick<ResourcesApiService, 'listResourceTypes' | 'listResources'> = {
      listResourceTypes: () => of({ data: [resourceType()] } satisfies ApiPage<ResourceType>),
      listResources: () => of({ data: [resource()], meta: {
        current_page: 2,
        from: 1,
        last_page: 3,
        links: [],
        path: 'http://api.test/resources',
        per_page: 15,
        to: 1,
        total: 31,
      } } satisfies ApiPage<Resource>),
    };

    await TestBed.configureTestingModule({
      imports: [ResourcesListComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: queryParamMap.asObservable() },
        },
        { provide: ResourcesApiService, useValue: resourcesApi },
        { provide: AuthService, useValue: { hasPermission: () => true } satisfies Pick<AuthService, 'hasPermission'> },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(ResourcesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('hydrates filters from query params and writes changes back to the URL', () => {
    expect(component.search()).toBe('room');
    expect(component.typeControl.value).toBe('1');
    expect(component.statusControl.value).toBe('active');
    expect(component.page()).toBe(2);

    component.search.set('notebook');
    component.typeControl.setValue('');
    component.statusControl.setValue('maintenance');
    component.applyFilters();

    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: expect.objectContaining({
        search: 'notebook',
        type: null,
        status: 'maintenance',
        page: 1,
      }),
      queryParamsHandling: 'merge',
    }));
  });
});

function resourceType(): ResourceType {
  return {
    id: 1,
    name: 'Rooms',
    slug: 'rooms',
    icon: 'building',
    requires_approval: true,
    max_duration_minutes: 240,
    color: '#06B6D4',
    created_at: '2026-05-23T00:00:00Z',
    updated_at: '2026-05-23T00:00:00Z',
  };
}

function resource(): Resource {
  return {
    id: 1,
    resource_type_id: 1,
    resource_type: resourceType(),
    name: 'Room A',
    code: 'ROOM-A',
    description: null,
    location: 'HQ',
    capacity: 8,
    status: 'active',
    metadata: null,
    deleted_at: null,
    created_at: '2026-05-23T00:00:00Z',
    updated_at: '2026-05-23T00:00:00Z',
  };
}

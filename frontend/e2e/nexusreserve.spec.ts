import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const API_URL = process.env['E2E_API_URL'] ?? 'http://localhost:8000/api/v1';

async function login(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

async function apiToken(request: APIRequestContext, email = 'admin@demo'): Promise<string> {
  const response = await request.post(`${API_URL}/auth/login`, {
    form: {
      email,
      password: 'password',
    },
    headers: {
      Accept: 'application/json',
    },
  });

  expect(response.ok()).toBeTruthy();
  const payload = await response.json() as { token: string };

  return payload.token;
}

async function createManagedResource(request: APIRequestContext, prefix: string): Promise<{ id: number; name: string }> {
  const token = await apiToken(request);
  const suffix = Date.now();
  const typeResponse = await request.post(`${API_URL}/resource-types`, {
    form: {
      name: `${prefix} Rooms ${suffix}`,
      slug: `${prefix.toLowerCase()}-rooms-${suffix}`,
      icon: 'building-2',
      requires_approval: '1',
      max_duration_minutes: '240',
      color: '#06B6D4',
    },
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  expect(typeResponse.ok()).toBeTruthy();
  const typePayload = await typeResponse.json() as { data: { id: number } };
  const name = `${prefix} Strategy Room ${suffix}`;
  const resourceResponse = await request.post(`${API_URL}/resources`, {
    form: {
      resource_type_id: String(typePayload.data.id),
      name,
      code: `${prefix.toUpperCase()}-${suffix}`,
      description: 'Playwright managed resource',
      location: 'HQ Portfolio Lab',
      capacity: '8',
      status: 'active',
    },
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  expect(resourceResponse.ok()).toBeTruthy();
  const resourcePayload = await resourceResponse.json() as { data: { id: number; name: string } };

  return { id: resourcePayload.data.id, name: resourcePayload.data.name };
}

test('login opens the authenticated operations shell', async ({ page }) => {
  await login(page, 'admin@demo');

  await expect(page.getByRole('link', { name: /resources/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /reservations/i })).toBeVisible();
});

test('requester creates a reservation and manager approves it', async ({ browser, request }) => {
  const resource = await createManagedResource(request, 'E2EFlow');
  const purpose = `E2E portfolio approval flow ${Date.now()}`;
  const requesterPage = await browser.newPage();
  await login(requesterPage, 'requester@demo');

  await requesterPage.getByRole('link', { name: /reservations/i }).click();
  await requesterPage.getByRole('button', { name: /new reservation/i }).click();
  const startsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  startsAt.setUTCHours(13, 0, 0, 0);
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
  const toLocalInput = (date: Date): string => date.toISOString().slice(0, 16);

  await requesterPage.getByLabel('Resource').selectOption({ label: `${resource.name} / E2EFLOW-${resource.name.split(' ').at(-1)}` });
  await requesterPage.getByLabel('Starts').fill(toLocalInput(startsAt));
  await requesterPage.getByLabel('Ends').fill(toLocalInput(endsAt));
  await requesterPage.getByLabel('Purpose').fill(purpose);
  await requesterPage.getByRole('button', { name: /submit reservation/i }).click();
  await expect(requesterPage.locator('section').filter({ hasText: purpose }).getByText('pending')).toBeVisible();
  await requesterPage.close();

  const managerPage = await browser.newPage();
  await login(managerPage, 'manager@demo');
  await managerPage.getByRole('link', { name: /reservations/i }).click();
  await managerPage.getByRole('link', { name: purpose }).click();
  await managerPage.getByLabel('Action note').fill('Approved by Playwright');
  await managerPage.getByTestId('approve-action').click();
  await expect(managerPage.locator('section').filter({ hasText: purpose }).getByText('approved').first()).toBeVisible();
  await managerPage.close();
});

test('admin creates and filters a managed resource', async ({ page }) => {
  await login(page, 'admin@demo');
  await page.getByRole('link', { name: /resources/i }).click();

  const suffix = Date.now();
  const resourceName = `E2E Equipment ${suffix}`;
  await page.getByRole('button', { name: /add resource/i }).click();
  await page.getByLabel('Resource type').selectOption({ index: 1 });
  await page.getByLabel('Name').fill(resourceName);
  await page.getByLabel('Code').fill(`E2E-EQ-${suffix}`);
  await page.getByLabel('Description').fill('Created by Playwright E2E');
  await page.getByLabel('Location').fill('HQ Automation Lab');
  await page.getByLabel('Capacity').fill('4');
  const createResponse = page.waitForResponse((response) => {
    return response.url().includes('/api/v1/resources') && response.request().method() === 'POST';
  });
  await page.locator('app-modal form').evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
  });
  expect((await createResponse).ok()).toBeTruthy();
  await expect(page.getByRole('link', { name: resourceName })).toBeVisible();

  await page.getByLabel('Search').fill(resourceName);
  await page.getByRole('button', { name: /^apply$/i }).click();
  await expect(page.getByRole('link', { name: resourceName })).toBeVisible();
});

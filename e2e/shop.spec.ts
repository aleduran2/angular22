import { Page, expect, test } from '@playwright/test';

const cartCount = (page: Page) => page.getByTestId('cart-count');

async function addFirstProduct(page: Page): Promise<void> {
  await page.goto('/catalogo');
  await page.getByRole('button', { name: 'Agregar', exact: true }).first().click();
  await expect(cartCount(page)).toHaveText('1');
}

async function login(page: Page): Promise<void> {
  await page.getByLabel('Email').fill('dev@example.com');
  await page.getByLabel('Contraseña').fill('angular22');
  await page.getByRole('button', { name: 'Ingresar' }).click();
}

async function fillCheckout(page: Page, zip: string): Promise<void> {
  await page.getByLabel('Nombre completo').fill('Ada Lovelace');
  await page.getByLabel('Dirección').fill('Av. Siempre Viva 742');
  await page.getByLabel('Ciudad').fill('Buenos Aires');
  await page.getByLabel('Código postal').fill(zip);
  await page.getByLabel('Número de tarjeta').fill('4111111111111111');
  await page.getByLabel('Titular').fill('Ada Lovelace');
  await page.getByLabel('Acepto los términos y condiciones').check();
}

test.describe('shell + microfrontends', () => {
  test('el catálogo remoto actualiza el carrito del shell', async ({ page }) => {
    await addFirstProduct(page);

    await page.getByRole('link', { name: /Carrito/ }).click();
    await expect(page).toHaveURL(/\/carrito$/);
    await expect(page.getByRole('heading', { name: 'Carrito' })).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'c/u' })).toHaveCount(1);
  });

  test('la búsqueda filtra los productos', async ({ page }) => {
    await page.goto('/catalogo');
    await page.getByRole('searchbox', { name: 'Buscar productos' }).fill('silla');

    await expect(page.getByText('1 producto', { exact: true })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(1);
  });

  test('el detalle carga las opiniones en diferido', async ({ page }) => {
    await page.goto('/catalogo/1');

    await expect(page.getByRole('heading', { name: 'Teclado mecánico K8' })).toBeVisible();
    await expect(page.getByText('El mejor teclado que tuve para programar.')).toBeVisible();
  });

  test('el checkout exige sesión y confirma el pedido', async ({ page }) => {
    await addFirstProduct(page);
    await page.goto('/carrito');
    await page.getByRole('link', { name: 'Finalizar compra' }).click();

    await expect(page).toHaveURL(/\/login\?returnUrl=/);
    await login(page);
    await expect(page).toHaveURL(/\/carrito\/checkout$/);

    await fillCheckout(page, '1414');
    await page.getByRole('button', { name: 'Confirmar pedido' }).click();

    await expect(page.getByRole('heading', { name: '¡Gracias por tu compra!' })).toBeVisible();
    await expect(cartCount(page)).toHaveCount(0);
  });

  test('el checkout muestra validaciones del cliente y del servidor', async ({ page }) => {
    await addFirstProduct(page);
    await page.goto('/login?returnUrl=/carrito/checkout');
    await login(page);
    await expect(page).toHaveURL(/\/carrito\/checkout$/);

    await page.getByRole('button', { name: 'Confirmar pedido' }).click();
    await expect(page.getByText('Ingresá tu nombre completo')).toBeVisible();

    await fillCheckout(page, '0000');
    await page.getByRole('button', { name: 'Confirmar pedido' }).click();
    await expect(page.getByText('No hacemos envíos a ese código postal')).toBeVisible();
  });

  test('si un remote no responde, el shell muestra un fallback', async ({ page }) => {
    await page.route('http://localhost:4202/**', (route) => route.abort());
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'NG22 Shop' })).toBeVisible();

    await page.getByRole('link', { name: /Carrito/ }).click();
    await expect(page.getByRole('heading', { name: 'Sección no disponible' })).toBeVisible();

    await page.getByRole('link', { name: 'Catálogo' }).click();
    await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible();
  });
});

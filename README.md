# NG22 Shop: Angular 22 + microfrontends

Tienda de ejemplo para estudiar Angular 22 y practicar ejercicios de code challenge. Son tres aplicaciones Angular (un shell y dos microfrontends) que comparten una librería y se integran en runtime con Native Federation.

- Ejercicios para practicar: [docs/EXERCISES.md](docs/EXERCISES.md)
- Resumen de conceptos y preguntas de entrevista: [docs/CHEATSHEET.md](docs/CHEATSHEET.md)

## Cómo correrlo

Requiere Node `^22.22.3`, `^24.15.0` o `>=26` (lo exige el CLI de Angular 22).

```bash
npm install
npm start
```

`npm start` levanta los cuatro procesos:

| Proceso  | URL                       | Qué es                              |
| -------- | ------------------------- | ----------------------------------- |
| shell    | http://localhost:4200     | Host: header, router y login        |
| catalogo | http://localhost:4201     | Microfrontend: listado y detalle    |
| carrito  | http://localhost:4202     | Microfrontend: carrito y checkout   |
| api      | http://localhost:3000/api | API falsa en memoria, sin dependencias |

Login de prueba: cualquier email y la contraseña `angular22`.

Cada microfrontend también funciona solo en su puerto (`npm run start:catalogo` + `npm run api`), que es como trabajaría el equipo dueño de esa parte.

## Scripts

| Script                  | Qué hace                                             |
| ----------------------- | ---------------------------------------------------- |
| `npm start`             | API + los dos remotes + shell                        |
| `npm run build`         | Build de producción de las tres apps                 |
| `npm test`              | Tests unitarios (Vitest) de los cuatro proyectos     |
| `npm run test:coverage` | Lo mismo, con reporte de cobertura                   |
| `npm run e2e`           | Tests E2E (Playwright); levanta lo que haga falta    |
| `npm run format`        | Prettier                                             |

La primera vez que corras los E2E: `npx playwright install chromium`.

## Arquitectura

```
                  ┌──────────────────────── shell :4200 ────────────────────────┐
                  │  header · router · login · toasts                           │
                  │                                                             │
                  │   /catalogo ──────────────┐      /carrito ───────────────┐  │
                  │   remote catalogo :4201   │      remote carrito :4202    │  │
                  │   listado, detalle        │      carrito, checkout       │  │
                  └───────────┬───────────────┴──────────────┬───────────────┴──┘
                              │                              │
                              └────── @shop/shared ──────────┘
                    CartService · AuthService · interceptors · UI
                                         │
                                  API :3000/api
```

```
projects/
  shell/      host. Solo layout, rutas y el fallback si un remote no carga
  catalogo/   remote. Expone ./routes
  carrito/    remote. Expone ./routes
  shared/     librería @shop/shared (path mapping en tsconfig.json)
tools/mock-api/   API falsa
e2e/              Playwright
```

### Cómo se conectan las piezas

1. `projects/shell/src/main.ts` llama a `initFederation('federation.manifest.json')`. El manifest (`projects/shell/public/`) dice en qué URL vive cada remote. Con eso se arma un import map.
2. Recién después se hace `import('./bootstrap')` y arranca Angular. Por eso `main.ts` y `bootstrap.ts` están separados: Angular es una dependencia compartida y tiene que resolverse vía el import map.
3. `app.routes.ts` del shell usa `loadChildren: remoteRoutes('catalogo')`. Al navegar, se baja el código del remote y se usan las rutas que expone en su `federation.config.mjs`.
4. Las rutas del remote se montan dentro del injector del shell. Por eso `CartService` es una sola instancia: el contador del header (shell) cambia cuando `catalogo` agrega un producto.

Dos consecuencias que conviene tener claras:

- **Dentro del shell manda el `app.config.ts` del shell.** El `app.config.ts` de cada remote solo se usa cuando ese remote corre solo. Si un remote necesita un provider, lo tiene que proveer el shell o declararlo en sus rutas (`providers: []`).
- **`@shop/shared` es el punto de acoplamiento.** Un cambio que rompe su API rompe a las tres apps. Por eso contiene poco: modelos, sesión, carrito y un par de componentes.

## Qué mirar: mapa de features

| Tema | Dónde |
| --- | --- |
| Zoneless (default desde v21) y OnPush por defecto (v22) | `projects/shell/src/app/app.config.ts` |
| `signal`, `computed`, `effect` | `projects/shared/src/lib/cart/cart.service.ts` |
| `linkedSignal` | `projects/catalogo/src/app/products/product-list.page.ts` (paginación) |
| `input()`, `output()`, `model()` | `product-card.ts`, `projects/shared/src/lib/ui/quantity-stepper.ts` |
| Control flow `@if` / `@for` / `@empty` / `@let` | `product-list.page.ts`, `projects/carrito/src/app/cart/cart.page.ts` |
| `@switch` exhaustivo y `@case` múltiples (v22) | `stock-badge.ts`, `projects/carrito/src/app/orders/order.page.ts` |
| Arrow functions y comentarios en templates (v22) | `quantity-stepper.ts`, `product-card.ts` |
| `@defer` con `@placeholder` / `@loading` / `@error` | `product-detail.page.ts` |
| `httpResource` | `product-list.page.ts`, `product-detail.page.ts`, `order.page.ts` |
| `resource` con `abortSignal` | `product-reviews.ts` |
| Interop RxJS (`toObservable`, `toSignal`) | `product-list.page.ts` (debounce del buscador) |
| Signal Forms: schema, validación condicional, errores de servidor | `projects/carrito/src/app/checkout/` |
| `@Service()` (v22) | `cart.service.ts`, `auth.service.ts` |
| `injectAsync()` (v22): servicio en un chunk aparte | `product-list.page.ts` + `csv-exporter.ts` |
| `InjectionToken` con factory | `projects/shared/src/lib/core/tokens.ts` |
| Interceptors funcionales | `auth.interceptor.ts`, `error.interceptor.ts` |
| Guard funcional + `returnUrl` | `auth.guard.ts`, `login.page.ts` |
| `withComponentInputBinding` (params, query y data como inputs) | `product-detail.page.ts`, `login.page.ts`, `remote-error.page.ts` |
| Lazy loading con `loadComponent` | `catalogo.routes.ts`, `carrito.routes.ts` |
| Federation: host dinámico y fallback | `projects/shell/src/main.ts`, `federation/remote-loader.ts` |
| Federation: qué expone un remote | `projects/*/federation.config.mjs` |
| Tests con `HttpTestingController` y `RouterTestingHarness` | `*.spec.ts` |

## API falsa

`tools/mock-api/server.mjs`. El estado vive en memoria y se reinicia con el proceso.

| Endpoint | Notas |
| --- | --- |
| `GET /products?q=&category=&sort=&page=&pageSize=` | `sort`: `name`, `price_asc`, `price_desc`, `rating` |
| `GET /products/:id` · `GET /products/:id/reviews` | |
| `GET /categories` | |
| `POST /auth/login` | contraseña `angular22` |
| `POST /orders` · `GET /orders/:id` | requieren `Authorization: Bearer` |

Para practicar estados de error:

- `?fail` en cualquier URL responde 500.
- Código postal `0000` o un cupón distinto de `NG22` hacen que `POST /orders` responda 422 con errores por campo.
- `API_LATENCY=1500 npm run api` simula una red lenta.

## Tests

- **Unitarios (Vitest, el runner por defecto del CLI):** 57 tests. Cobertura de sentencias al momento de escribir esto: shell 84%, catalogo 76%, carrito 92%, shared 95%.
- **E2E (Playwright):** `e2e/shop.spec.ts` cubre lo que los unitarios no pueden: que el shell cargue los remotes, que compartan estado, el flujo de compra completo y el fallback cuando un remote no responde.

## Versiones y estado de las APIs

Angular 22.2, TypeScript 6.0, `@angular-architects/native-federation` 22.2.

- API pública estable en v22 (marcadas `@publicApi 22.0` en los tipos): Signal Forms, `resource` / `httpResource`, `@Service`, `injectAsync`.
- No usadas en el código por no ser estables; están como ejercicio: `debounced()` (experimental) y `@boundary` / `@error` (developer preview).

## Qué no incluye

- **SSR e hidratación incremental.** Combinarlas con federation suma bastante configuración; queda como ejercicio avanzado.
- **CI y deploy.** En producción cada remote se publica por separado y el manifest apunta a las URLs reales.
- **Aislamiento de estilos entre remotes.** Los tres importan la misma hoja base desde `projects/shared/src/styles/shop.css`.

# Ejercicios

Pensados como code challenges: cada uno tiene un objetivo acotado y criterios de aceptación verificables. El tiempo es orientativo.

Forma de trabajo sugerida (Gitflow): una rama `feature/<ejercicio>` desde `develop`, tests incluidos, y `npm test` + `npm run e2e` en verde antes de mergear.

## Nivel 1: componentes y signals (15 a 30 min)

### 1. Pipe de puntuación

Mostrar el `rating` del producto como estrellas en la card y en el detalle.

- Crear un pipe puro `stars` en `@shop/shared` (`4.7` → `★★★★★`, redondeando).
- Reemplazar el `'★'.repeat(...)` de `product-reviews.ts` por el pipe.
- El valor numérico tiene que seguir disponible para lectores de pantalla (`aria-label`).
- Test unitario del pipe con `it.each`.

### 2. Directiva de autofocus

El buscador del catálogo recibe foco al entrar a la página.

- Directiva `shopAutofocus` en `@shop/shared`, usando `afterNextRender`.
- No tiene que romper si en el futuro se renderiza en servidor.

### 3. Filtro "solo con stock"

- Checkbox en los filtros del catálogo.
- Nuevo parámetro `inStock=true` en `GET /products` (hay que tocar `tools/mock-api/server.mjs`).
- Al cambiar el filtro, la paginación vuelve a la página 1. Mirá cómo lo resuelve `linkedSignal` hoy.
- Test: el request incluye el parámetro.

### 4. Confirmar antes de vaciar el carrito

- "Vaciar" abre un `<dialog>` nativo de confirmación.
- Se cierra con Escape y devuelve el foco al botón.
- Usar `viewChild()` para acceder al dialog.

### 5. Estado vacío reutilizable

`product-list.page.ts` y `cart.page.ts` tienen estados vacíos parecidos.

- Extraer un componente `shop-empty-state` con `input()` para el título y proyección de contenido (`<ng-content>`) para la acción.
- Usarlo en los dos remotes sin duplicar estilos.

## Nivel 2: datos, formularios y router (30 a 60 min)

### 6. Filtros en la URL

Hoy los filtros se pierden al recargar.

- `q`, `category`, `sort` y `page` viven en los query params.
- Los inputs se inicializan desde la URL (ya está activo `withComponentInputBinding`).
- Atrás/adelante del navegador restaura los filtros.
- Test E2E: recargar mantiene la búsqueda.

### 7. Sin parpadeo al paginar

Al cambiar de página se ve el skeleton completo.

- Mantener los resultados anteriores visibles (atenuados) mientras carga la página nueva.
- El skeleton solo aparece en la primera carga.
- Pista: `linkedSignal` recibe el valor anterior en `computation`; `httpResource` expone `status()` e `isLoading()`.

### 8. `debounced()` en lugar de RxJS

- Reemplazar `toObservable` + `debounceTime` del buscador por `debounced()` de `@angular/core` (experimental en v22).
- Explicar en el PR qué se gana, qué se pierde y por qué (no) lo llevarías a producción.

### 9. Guard de cambios sin guardar

- `canDeactivate` funcional en `/carrito/checkout`: si el formulario está `dirty()` y no se envió, pedir confirmación.
- No tiene que saltar después de confirmar un pedido.
- Test con `RouterTestingHarness`.

### 10. Título dinámico del detalle

- La pestaña del navegador muestra el nombre del producto.
- Resolverlo con un `ResolveFn` en la ruta y comparar con hacerlo desde el componente con `Title` + `effect`. Quedarse con uno y justificar.

### 11. Validación asíncrona del cupón

- Nuevo endpoint `GET /coupons/:code` en la API falsa.
- En `checkout.form.ts`, validar el cupón contra ese endpoint con `validateHttp` (o `validateAsync`) y un `debounce`.
- Mostrar "Validando…" mientras `pending()` es `true`.
- Mostrar el descuento en el total antes de confirmar.

### 12. Favoritos

- `FavoritesService` en `@shop/shared`, persistido igual que el carrito.
- Botón de favorito en la card (catalogo) y contador en el header (shell).
- Test que demuestre que shell y remote ven el mismo estado.

### 13. Stock actualizado después de comprar

Después de un pedido, el catálogo puede seguir mostrando stock viejo y el carrito guarda una copia del stock.

- Definir y documentar una estrategia (recargar el recurso, invalidar al navegar, revalidar el carrito al entrar al checkout).
- Manejar el caso en que el servidor rechaza por falta de stock (`422` con `field: 'items'`).

### 14. Subir la cobertura de `catalogo` a 90%

- Faltan tests de `product-reviews.ts` (usa `fetch`: hay que mockearlo) y de `exportCsv`.
- Sin bajar la calidad: nada de tests que solo ejecuten código sin verificar nada.

## Nivel 3: microfrontends y arquitectura (1 a 3 h)

### 15. Tercer microfrontend: historial de pedidos

- Generar la app `pedidos`, inicializarla como remote en el puerto 4203 y exponer `./routes`.
- Endpoint `GET /orders` (los del usuario logueado).
- Registrarlo en el manifest y en las rutas del shell, protegido con `authGuard`.
- Tiene que funcionar también standalone.

```bash
ng g application pedidos --style=css --routing --ssr=false
ng g @angular-architects/native-federation:init --project pedidos --port 4203 --type remote
```

### 16. Exponer un componente, no rutas

- `carrito` expone un `MiniCart` (lista corta + subtotal).
- El shell lo muestra en un panel al hacer click en el ícono del carrito, cargándolo recién en ese momento (`REMOTE_LOADER` + `NgComponentOutlet`, o `@defer` con un wrapper).
- Si el remote no está disponible, el header sigue funcionando.

### 17. Manifest por ambiente

- El shell no tiene que recompilarse para apuntar a otros remotes.
- Cargar el manifest desde una URL configurable en runtime (por ejemplo `config.json` servido junto al shell).
- Documentar cómo sería el deploy independiente de un remote.

### 18. Comunicación sin librería compartida

- Implementar "producto agregado" entre `catalogo` y el shell usando `CustomEvent` o `BroadcastChannel`, sin pasar por `@shop/shared`.
- Comparar con el servicio compartido: acoplamiento, tipado, testeo, qué pasa si los remotes usan versiones distintas de la lib.

### 19. Conflicto de versiones

- En `federation.config.mjs` cambiar `strictVersion` y `singleton` y observar qué pasa en consola y en runtime.
- Explicar qué ocurriría si `catalogo` actualizara Angular antes que el shell y cómo lo evitarías.

### 20. Error boundaries

- Envolver `<cat-product-reviews>` con `@boundary { ... } @error (let err) { ... }` (developer preview en v22).
- Forzar un error de render y verificar que el resto del detalle siga funcionando.
- Comparar con el `@error` de `@defer`: cuál cubre qué.

### 21. SSR con hidratación incremental

- Agregar SSR al shell y a `catalogo`.
- Hidratar el bloque de opiniones con `@defer (hydrate on viewport)`.
- Medir el JS inicial antes y después.
- Ojo con `localStorage` en servidor: para eso existe el token `STORAGE`.

### 22. Aislar estilos de un remote

- Hacer que los estilos de `carrito` no puedan pisar ni ser pisados por los del shell.
- Probar `ViewEncapsulation.ShadowDom` y documentar qué se rompe (variables CSS, estilos globales, formularios).

## Para practicar con tiempo

Elegí un ejercicio de nivel 2, poné un timer de 45 minutos y entregá: código, al menos un test que falle sin tu cambio, y dos líneas sobre qué dejarías para después. Es el formato más parecido a un challenge real.

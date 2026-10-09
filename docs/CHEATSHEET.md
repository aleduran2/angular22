# Conceptos clave de Angular 22

Resumen para repasar antes de una entrevista. Cada punto apunta a un archivo del repo donde verlo funcionando.

## Reactividad

| API | Para qué | Tener en cuenta |
| --- | --- | --- |
| `signal()` | Estado mutable | Actualizar con `set` / `update`, siempre de forma inmutable |
| `computed()` | Estado derivado | Lazy y memoizado. Sin efectos secundarios |
| `effect()` | Sincronizar con algo externo (storage, DOM, logs) | No usarlo para derivar estado: eso es `computed` |
| `linkedSignal()` | Estado derivado que además se puede escribir | Se recalcula cuando cambia la fuente |
| `untracked()` | Leer un signal sin crear dependencia | |

- **Zoneless:** no hay `zone.js`. La vista se actualiza cuando cambia un signal leído en el template, se dispara un evento del template o se llama a `markForCheck`. Un `setTimeout` que cambia una propiedad común ya no refresca la vista.
- **OnPush por defecto (v22):** `ChangeDetectionStrategy.Default` pasó a llamarse `Eager`.

Ver: `cart.service.ts`, `product-list.page.ts`.

## Componentes

- `input()` / `input.required()`: inputs como signals de solo lectura.
- `output()`: reemplaza a `@Output` + `EventEmitter`.
- `model()`: input + output en uno, habilita `[(value)]`.
- `viewChild()` / `contentChild()`: queries como signals.
- Todo es standalone; `imports` va en el componente.

Ver: `product-card.ts`, `quantity-stepper.ts`.

## Templates

- `@if` / `@else`, `@for` (con `track` obligatorio y `@empty`), `@switch`, `@let`.
- v22: varios `@case` seguidos comparten bloque; `@default never;` hace el `@switch` exhaustivo; arrow functions, spread y comentarios entre atributos.
- El chequeo exhaustivo necesita una referencia estable: `@let current = level();` y después `@switch (current)`. Con `@switch (level())` no compila.
- `@defer`: separa un bloque en su propio chunk. Triggers `on idle | viewport | interaction | hover | immediate | timer()` y `when cond`. Bloques `@placeholder`, `@loading`, `@error`.

Ver: `stock-badge.ts`, `order.page.ts`, `product-detail.page.ts`.

## Datos asíncronos

| API | Cuándo |
| --- | --- |
| `httpResource(() => url \| request)` | GET reactivo: se vuelve a pedir cuando cambian los signals que lee. Pasa por los interceptors |
| `resource({ params, loader })` | Cualquier Promise. `abortSignal` cancela el pedido anterior |
| `rxResource` | Igual, con un Observable como loader |
| `HttpClient` directo | Mutaciones (POST, PUT, DELETE). Los resources son para lecturas |

- Estado: `value()`, `hasValue()`, `isLoading()`, `error()`, `status()`, `reload()`.
- Leer `value()` con el recurso en error lanza una excepción: chequear `hasValue()` o `error()` antes.

Ver: `product-list.page.ts`, `product-reviews.ts`, `checkout.page.ts`.

## Signal Forms

```ts
const model = signal({ email: '', password: '' });
const f = form(model, (path) => {
  required(path.email, { message: 'Obligatorio' });
  email(path.email);
});
```

```html
<form [formRoot]="f">
  <input [formField]="f.email" />
</form>
```

- El modelo es un signal común: el formulario no guarda una copia del valor.
- `f.email` es el campo; `f.email()` es su estado: `value()`, `errors()`, `valid()`, `touched()`, `dirty()`, `pending()`, `hidden()`, `disabled()`.
- Reglas: `required`, `email`, `min`, `max`, `minLength`, `maxLength`, `pattern`, `validate` (propia), `validateAsync` / `validateHttp`, `applyWhen` (condicional), `applyEach` (arrays), `hidden`, `disabled`, `readonly`.
- Envío: `submission: { action }` en las opciones del `form`. `[formRoot]` la ejecuta solo si el formulario es válido. Lo que devuelve `action` se aplica como errores, atados a un campo si incluyen `fieldTree`.
- `schema()` permite definir las reglas fuera del componente y testearlas sin render.

Ver: `checkout.form.ts`, `checkout.page.ts`, `login.page.ts`.

## Inyección de dependencias

- `inject()` en lugar de constructor. Solo funciona en contexto de inyección (constructor, inicializadores de campo, factories, guards, interceptors).
- `@Service()` (v22): equivalente corto de `@Injectable({ providedIn: 'root' })`.
- `injectAsync(() => import('./x'))` (v22): el servicio va a un chunk aparte y se baja al usarlo. `{ prefetch: onIdle }` lo adelanta.
- `InjectionToken` con `factory`: valor por defecto sin registrar nada, reemplazable en tests.

Ver: `tokens.ts`, `csv-exporter.ts`, `provide-shop-core.ts`.

## Router y HTTP

- Guards, resolvers e interceptors son funciones.
- `withComponentInputBinding()`: params, query params y `data` de la ruta llegan como `input()`.
- `loadComponent` / `loadChildren`: lazy loading por ruta. Las funciones corren en contexto de inyección.
- Orden de interceptors: el de `withInterceptors([a, b])` es el orden de salida del request; la respuesta vuelve al revés.

Ver: `auth.guard.ts`, `auth.interceptor.ts`, `error.interceptor.ts`, `catalogo.routes.ts`.

## Testing

- Vitest es el runner por defecto del CLI.
- Zoneless en tests: `await fixture.whenStable()` en lugar de `detectChanges()`.
- `fixture.componentRef.setInput('name', value)` para inputs con signals.
- HTTP: `provideHttpClient()` + `provideHttpClientTesting()` y `HttpTestingController`. Con `httpResource` hace falta `TestBed.tick()` para que salga el request.
- Rutas, guards y navegación: `RouterTestingHarness`.
- Código que sigue en promesas después de un `flush`: `await expect.poll(() => ...)`.

Ver: `product-list.page.spec.ts`, `checkout.page.spec.ts`.

## Microfrontends

- **Microfrontend:** una app dividida en apps más chicas, cada una con su equipo y su deploy.
- **Shell / host:** carga a las demás. **Remote:** lo que se carga.
- **Federation:** el host baja el código del remote en runtime, no en build. Native Federation lo hace con ES modules e import maps, sin depender de Webpack.
- **Dependencias compartidas:** Angular y las libs comunes se bajan una vez. `singleton: true` garantiza una sola instancia; `strictVersion: true` falla si las versiones son incompatibles.
- **Manifest dinámico:** las URLs de los remotes se leen al iniciar, así se cambian sin recompilar el shell.

Preguntas típicas:

1. **¿Cuándo no usarlos?** Un solo equipo o una app mediana. Resuelven un problema de organización (deploys y equipos independientes), no de performance. Con un equipo, lazy loading alcanza.
2. **¿Cómo comparten estado?** Servicio en una lib compartida (este repo), eventos del browser, o estado en la URL. Cuanto más se comparte, más acoplados quedan.
3. **¿Qué pasa si un remote está caído?** El shell tiene que seguir funcionando: ver `remote-loader.ts` y el último test de `e2e/shop.spec.ts`.
4. **¿Y si usan versiones distintas de Angular?** Con `strictVersion` falla al cargar. Las alternativas son coordinar upgrades o aislar el remote (web component con su propio Angular), a costa de peso.
5. **¿Por qué `main.ts` solo hace `import('./bootstrap')`?** Las dependencias compartidas se resuelven en runtime; hay que inicializar federation antes de que se evalúe cualquier import de Angular.
6. **¿Dónde viven los providers de un remote?** En el shell o en las rutas que expone. Su `app.config.ts` no se ejecuta cuando corre dentro del shell.

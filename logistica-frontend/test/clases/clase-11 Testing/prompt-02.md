```
Configura Playwright para E2E contra el backend Django real. NO modifiques código de producción.

Contexto:
- Frontend Next.js en http://localhost:3000, backend DRF en http://localhost:8000/api/v1/.
- Auth: el login (POST /auth/token/) devuelve { access, refresh }; el frontend los guarda en localStorage
  con claves "logistica_access_token" y "logistica_refresh_token"; el AuthGuard es client-side.

Tareas:
1. Instala @playwright/test y los navegadores (npx playwright install).
2. Crea playwright.config.ts:
   - testDir: "e2e"
   - use.baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000"
   - trace: "on-first-retry", screenshot: "only-on-failure"
   - projects:
       a) "setup" → testMatch /auth\.setup\.ts/
       b) "chromium" → dependencies: ["setup"], use.storageState: "playwright/.auth/user.json"
   - reporter: [["html"], ["list"]]
   - NO uses webServer automático: el server se levanta manual (regla del proyecto). Documenta esto en un comentario.
3. Crea e2e/auth.setup.ts:
   - Lee credenciales de E2E_USERNAME / E2E_PASSWORD (con valores por defecto de un usuario de test).
   - Hace login por la UI (/login) O, mejor, obtén tokens vía API (request.post a /auth/token/) y siembra
     localStorage con page.addInitScript o context.addInitState; luego guarda storageState en playwright/.auth/user.json.
   - Importante: storageState debe capturar el localStorage del origin http://localhost:3000.
4. Crea e2e/fixtures.ts:
   - Extiende `test` de Playwright con un fixture `api` que sea un request context autenticado:
     obtiene un JWT (POST /auth/token/) y agrega el header Authorization Bearer en cada request.
   - Expón helpers de seeding/cleanup que golpeen DRF directamente (crear/borrar registros sin pasar por la UI),
     genéricos por endpoint: seed(endpoint, payload) -> id, y remove(endpoint, id).
5. Crea e2e/login.spec.ts mínimo (sin storageState, en el project setup o uno aparte): login válido redirige a /dashboard;
   credenciales inválidas muestran "Usuario o contraseña incorrectos.".
6. Agrega a .gitignore: playwright/.auth/, test-results/, playwright-report/, /coverage ya existe.
7. Agrega scripts: "e2e", "e2e:ui" (--ui), "e2e:report".
8. Documenta en un comentario al inicio de playwright.config.ts los prerequisitos: backend corriendo en :8000,
   frontend en :3000, y existencia de un usuario de test (con su comando Django de creación sugerido).
9. Ejecuta `npm run e2e` (asumiendo servers arriba) y corrige hasta que login.spec.ts pase.

Entrega: archivos creados, prerequisitos para correr, y salida del primer spec.
```
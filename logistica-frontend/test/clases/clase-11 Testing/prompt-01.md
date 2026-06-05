Configura el entorno de tests unitarios/integración del frontend. NO modifiques código de producción.

Contexto: Next.js 16 (App Router), React 19, TypeScript 5 strict, alias "@/" en tsconfig.

Tareas:
1. Instala dev deps compatibles con React 19:
   vitest, @vitejs/plugin-react, jsdom, @testing-library/react (v16+), @testing-library/dom,
   @testing-library/jest-dom, @testing-library/user-event, msw, @types/node.
2. Crea vitest.config.ts:
   - plugin react()
   - environment: "jsdom"
   - globals: true
   - setupFiles: ["./test/setup.ts"]
   - resolve.alias para "@/" apuntando a la raíz del proyecto (replicar el de tsconfig.json)
   - coverage con provider v8, reporter ["text","html"], carpeta coverage/
3. Crea test/setup.ts:
   - import "@testing-library/jest-dom/vitest"
   - levanta el server de MSW: beforeAll(listen), afterEach(resetHandlers + cleanup de RTL), afterAll(close)
4. Crea test/msw/server.ts (setupServer) y test/msw/handlers.ts (array vacío exportado, sintaxis MSW v2: http + HttpResponse).
5. Crea un helper test/utils/renderWithQuery.tsx que envuelva el componente en un QueryClientProvider con un QueryClient de test (retry: false, gcTime: 0). Exporta también renderHook equivalente.
6. Agrega scripts a package.json: "test", "test:watch", "test:cov".
7. Crea un smoke test trivial (test/smoke.test.ts) que pase, para verificar el pipeline.
8. Ejecuta `npm run test` y corrige hasta que pase. Verifica que `npx tsc --noEmit` no rompa.

Entrega: lista de archivos creados, salida de los tests y confirmación de que tsc pasa.
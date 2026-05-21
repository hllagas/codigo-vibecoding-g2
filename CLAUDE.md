# Task Manager — Monorepo

Aplicación fullstack de gestión de tareas. El repositorio contiene dos proyectos independientes que se coordinan a través de una API REST.

## Estructura del repositorio

```
codigo-vibecoding-g2/
├── task-manager-backend/       # API REST — Node.js + Express + Prisma
│   ├── prisma/
│   │   ├── schema.prisma       # Modelos: User, Task
│   │   └── migrations/
│   ├── src/
│   │   ├── app.js              # Express app, CORS, rutas
│   │   ├── server.js           # Arranque del servidor (PORT 3001)
│   │   ├── lib/prisma.js       # Cliente Prisma singleton
│   │   ├── docs/swagger.js     # OpenAPI 3.0.3
│   │   ├── tasks/              # task.controller.js · task.repository.js · task.routes.js
│   │   └── users/              # user.controller.js · user.repository.js · user.routes.js
│   └── .env                    # DATABASE_URL, PORT=3001
│
└── task-manager-frontend/      # SPA — React 19 + TypeScript + Vite + Tailwind
    ├── src/
    │   ├── App.tsx             # Router principal
    │   ├── pages/              # LoginPage · TaskListPage · TaskDetailPage
    │   ├── components/
    │   │   ├── layout/         # Header
    │   │   ├── tasks/          # TaskCard · TaskForm · TaskList · TaskStatusBadge
    │   │   └── ui/             # Button · Dialog · CreateTaskDialog · EditTaskDialog · ...
    │   ├── services/
    │   │   └── taskService.ts  # Cliente HTTP (fetch), usa /api/tasks
    │   ├── hooks/useTasks.ts   # Hook de estado de tareas
    │   └── types/task.ts       # Tipos TypeScript
    └── vite.config.js          # Proxy /api → localhost:3001
```

---

## Backend (`task-manager-backend`)

### Stack
- **Runtime**: Node.js (ESM)
- **Framework**: Express 4
- **ORM**: Prisma 7 con adaptador PostgreSQL
- **Base de datos**: PostgreSQL (NeonDB en producción)
- **Auth**: Token UUID almacenado en DB (campo `token` en `User`)
- **Docs**: Swagger UI en `GET /api-docs`

### Arquitectura
Patrón **Controller → Repository → Prisma**. Cada dominio tiene sus tres archivos: `*.routes.js` registra los handlers, `*.controller.js` valida la request y forma la response, `*.repository.js` ejecuta las queries con Prisma.

### Endpoints
```
POST   /users/register   → { id, name, lastname, email, createdAt }
POST   /users/login      → { token }

GET    /tasks            → Task[]
POST   /tasks            → Task
GET    /tasks/:id        → Task
PUT    /tasks/:id        → Task
DELETE /tasks/:id        → 204

GET    /api-docs         → Swagger UI
```

### Correr el backend
> **IMPORTANTE**: Los servidores de desarrollo se inician **manualmente por el usuario**. La IA nunca debe ejecutar `npm run dev` ni ningún comando que levante un servidor.

```bash
cd task-manager-backend
cp .env.example .env    # ajustar DATABASE_URL y PORT=3001
npm install
npm run db:generate     # genera el cliente Prisma
npm run db:migrate      # aplica migraciones
npm run dev             # ejecutar manualmente — http://localhost:3001
```

---

## Frontend (`task-manager-frontend`)

### Stack
- **Framework**: React 19 + TypeScript
- **Build**: Vite 8
- **Estilos**: Tailwind CSS v4
- **Router**: React Router v7
- **Íconos**: lucide-react

### Arquitectura
`Pages` orquestan la UI, delegan fetch en `Services` y estado en `Hooks`. Los `Components` son presentacionales y reutilizables. Los `Types` definen el contrato de datos.

### Rutas de la SPA
```
/login           → LoginPage
/                → TaskListPage
/tasks/:id       → TaskDetailPage
```

### Correr el frontend
> **IMPORTANTE**: Los servidores de desarrollo se inician **manualmente por el usuario**. La IA nunca debe ejecutar `npm run dev` ni ningún comando que levante un servidor.

```bash
cd task-manager-frontend
npm install
npm run dev      # ejecutar manualmente — http://localhost:5173
```

---

## Comunicación entre proyectos

El frontend nunca llama directamente al puerto 3001. En desarrollo, Vite actúa como proxy:

```
Frontend                   Vite proxy              Backend
fetch('/api/tasks')  →→→  rewrite → /tasks  →→→  localhost:3001/tasks
fetch('/api/tasks/123')    rewrite → /tasks/123    localhost:3001/tasks/123
```

Configurado en `task-manager-frontend/vite.config.js`:
```js
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
}
```

El servicio en frontend usa siempre el prefijo `/api`:
```ts
// task-manager-frontend/src/services/taskService.ts
const BASE_URL = '/api/tasks'
```

---

## Guía para features nuevas

Cuando se planifica una feature que toca ambos proyectos, separar las tareas así:

| Tipo de cambio | Qué tocar en Backend | Qué tocar en Frontend |
|---|---|---|
| **Nuevo endpoint** | `*.routes.js` + `*.controller.js` + `*.repository.js` + `swagger.js` | Nuevo método en `*Service.ts` |
| **Nuevo modelo** | `prisma/schema.prisma` → `npm run db:migrate` | Nuevo tipo en `src/types/` |
| **Autenticación en rutas** | Crear `src/middleware/auth.js`, aplicar en rutas protegidas | Guardar token en `localStorage`, enviarlo como `Authorization: Bearer <token>` |
| **Nueva página** | Solo si requiere nuevos endpoints | Nueva page en `src/pages/`, nueva `<Route>` en `App.tsx` |
| **Nuevo componente UI** | No aplica | Componente en `src/components/ui/` o en el dominio correspondiente |
| **Cambio en schema** | Editar `schema.prisma` + migrar | Actualizar interfaces en `src/types/` |

### Orden recomendado al desarrollar una feature fullstack
1. Definir el contrato: qué endpoint, qué request body, qué response
2. Actualizar `swagger.js` (documenta antes de implementar)
3. Implementar backend: repository → controller → route
4. Agregar el método al service del frontend
5. Actualizar tipos TypeScript si el modelo cambió
6. Construir la UI (hook → componente → página)

---

## Convenciones

### Backend
- Archivos en `camelCase`, organizados por dominio (no por capa)
- ESM (`import/export`), sin CommonJS
- El controller valida y responde; el repository solo ejecuta queries
- Siempre actualizar `swagger.js` cuando se agrega o modifica un endpoint

### Frontend
- Archivos de componentes en `PascalCase.tsx`
- Archivos de hooks, services y types en `camelCase.ts`
- Usar siempre `.tsx` / `.ts`, nunca `.jsx` / `.js`
- Lógica de fetch centralizada en `src/services/`, nunca `fetch` directo en componentes

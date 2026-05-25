# Alcance del MVP — logistica-api

## Objetivo

Construir una API REST funcional para gestión logística de envíos de productos tecnológicos, lista para ser desplegada en Railway y consumida por un cliente frontend.

---

## Lo que incluye el MVP

### Módulos (CRUD completo por cada uno)

| Módulo | App Django | Endpoints mínimos |
|---|---|---|
| Proveedores | `suppliers` | CRUD + búsqueda por nombre |
| Almacenes | `warehouses` | CRUD + stock por almacén |
| Clientes | `customers` | CRUD + búsqueda por nombre/email |
| Productos | `products` | CRUD + filtro por categoría/proveedor |
| Conductores | `drivers` | CRUD + filtro por disponibilidad |
| Transportes | `transports` | CRUD + filtro por tipo/conductor |
| Rutas | `routes` | CRUD + gestión de paradas |
| Envíos | `shipments` | CRUD + cambio de estado + ítems del envío |

### Autenticación

- **Mecanismo**: Django `auth_user` (built-in) + JWT via `djangorestframework-simplejwt`
- **Endpoints**: `POST /api/v1/auth/token/` y `POST /api/v1/auth/token/refresh/`
- **Todos los endpoints** del MVP requieren `Authorization: Bearer <token>`

### Documentación automática

- Swagger UI en `/api/docs/`
- Schema OpenAPI en `/api/schema/`

### Deploy

- **Plataforma**: Railway
- **Dev**: SQLite (`db.sqlite3`)
- **Prod**: PostgreSQL — Railway inyecta `DATABASE_URL` como variable de entorno
- **Configuración**: `python-decouple` lee `.env` en dev y variables de entorno en Railway

---

## Lo que NO incluye el MVP

- Permisos granulares por rol (más allá de `IsAuthenticated`)
- Historial de asignaciones de conductores a transportes
- Notificaciones (email, push, SMS)
- Reportes y dashboards
- Carga masiva de datos
- API pública sin autenticación

---

## Metodología: Spec Driven Development (SDD)

Cada módulo se desarrolla en tres fases ejecutadas por agentes especializados. **El flujo es secuencial y obligatorio.**

```
┌─────────────────────────────────────────────────────┐
│                   ORCHESTRATOR                      │
│         Coordina el flujo entre agentes             │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────┐
│         SPEC AGENT          │
│  Lee requerimiento del      │
│  módulo y crea              │
│  spec/<module>.md           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│       IMPLEMENT AGENT       │
│  Lee spec/<module>.md y     │
│  escribe el código Django   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│       VALIDATOR AGENT       │
│  Revisa el código contra    │
│  spec + architecture.md +   │
│  database-schema.md         │
└──────────────┬──────────────┘
               │
      ┌────────┴────────┐
      │                 │
   Errores          Sin errores
      │                 │
      ▼                 ▼
  Volver a         Módulo listo
  Implement        ✓
```

### Responsabilidades por agente

| Agente | Escribe código | Output |
|---|---|---|
| Orchestrator | No | Coordina y reporta estado |
| Spec | No (solo MD) | `spec/<module>.md` |
| Implement | Sí | Archivos Python del módulo |
| Validator | No | `spec/validation/<module>_errors.md` o mensaje OK |

### Orden de implementación de módulos

Respetar dependencias del schema — ver `docs/database-schema.md`:

1. Setup base (DRF, JWT, spectacular, settings, `config/urls.py`)
2. `suppliers`
3. `warehouses`
4. `customers`
5. `products` (depende de `suppliers`)
6. Stock en `warehouses` (depende de `products`)
7. `drivers` (depende de `auth_user`)
8. `transports` (depende de `drivers`)
9. `routes` + paradas (depende de `transports` + `warehouses`)
10. `shipments` + ítems (depende de todo lo anterior)

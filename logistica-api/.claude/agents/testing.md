---
name: testing
description: Agente de unit testing para Django. Escribe tests de un módulo a la vez, cubre happy path / unhappy path / edge case, ejecuta los tests y corrige errores, y genera reporte de cobertura HTML. Mínimo 80% de cobertura. Activa el entorno virtual antes de cualquier comando.
---

# Testing Agent — Unit testing de módulos Django

## Rol

Escribir tests unitarios para un módulo (app Django) a la vez. No testear más de un módulo por ejecución. Ejecutar los tests al terminar, corregir errores hasta que pasen, y generar el reporte HTML de cobertura.

## Documentos que debes leer antes de testear cualquier módulo

> **REGLA**: Leer los tres documentos antes de escribir un solo test. No asumir comportamiento sin verificar en estos archivos primero.

| Documento | Qué aporta al testing |
|---|---|
| **[`docs/database-schema.md`](../docs/database-schema.md)** | Campos requeridos, nullable, unique y FKs — definen qué casos son unhappy path vs edge case |
| **[`docs/architecture.md`](../docs/architecture.md)** | Sección **Testing** (estructura de carpetas `tests/`, patrón `APITestCase`), endpoints por módulo, permisos JWT, acciones custom y transiciones de estado |
| **[`docs/mvp-scope.md`](../docs/mvp-scope.md)** | Alcance del MVP — qué módulos existen y qué funcionalidad está en scope para testear |

### Qué extraer de cada documento

**`docs/architecture.md` → sección Testing:**
- Estructura obligatoria: `tests/test_models.py` + `tests/test_views.py` por app
- Patrón base `APITestCase` con `force_authenticate`
- Endpoints estándar generados por `DefaultRouter`
- Acciones custom: `stops`, `stock`, `status`
- Permisos: `IsAuthenticated` global, `IsAdminUser` en `drivers` y `transports`

**`docs/database-schema.md` → por módulo:**
- Campos con `NOT NULL` sin default → obligatorios en `valid_payload`
- Campos con `UNIQUE` → edge case de duplicado → error esperado
- Campos `nullable` → edge case de null permitido → debe aceptarse
- FKs con `ON DELETE PROTECT` → unhappy path: eliminar padre con hijos → 4xx

**`docs/mvp-scope.md`:**
- Confirmar qué módulos están implementados antes de testear
- No escribir tests para funcionalidad fuera del MVP scope

## Restricciones de ejecución

- **Nunca testear más de un módulo por ejecución**. Si el usuario pide testear todo el proyecto, testear módulo por módulo y pedir confirmación entre cada uno.
- **Siempre activar el entorno virtual** antes de ejecutar cualquier comando:
  ```powershell
  .venv\Scripts\Activate.ps1
  ```
- **Nunca ejecutar** `python manage.py runserver`. Todos los demás comandos de Django están permitidos.
- Si hay dudas sobre el comportamiento esperado de un endpoint o modelo, **preguntar al usuario antes de asumir**.

---

## Estructura de tests

`test_models.py` y `test_views.py` son archivos base, no el límite. Crear los archivos que el módulo necesite para mantener los tests organizados y legibles.

### Reglas de estructura

- Si el módulo tiene `tests.py` (archivo único) → convertir a carpeta `tests/` con `__init__.py` y distribuir los tests en los archivos que correspondan
- Si el módulo ya tiene carpeta `tests/` → agregar archivos nuevos dentro de ella según lo que se vaya a testear
- Cada archivo de test agrupa una responsabilidad cohesiva — si un archivo crece demasiado o mezcla responsabilidades distintas, separarlo

### Archivos posibles (no exhaustivo)

| Archivo | Cuándo crearlo |
|---|---|
| `test_models.py` | Siempre — validaciones, restricciones, valores por defecto, métodos del modelo |
| `test_views.py` | Siempre — CRUD estándar del ViewSet |
| `test_serializers.py` | Cuando el serializer tiene validaciones custom, `validate_<field>`, `validate()`, escritura anidada o campos calculados |
| `test_filters.py` | Cuando el módulo tiene `FilterSet` personalizado o múltiples `filterset_fields` que vale la pena testear combinados |
| `test_actions.py` | Cuando el módulo tiene acciones custom complejas (`stops`, `stock`, `status`) con múltiples casos |
| `test_permissions.py` | Cuando el módulo usa permisos distintos al global (`IsAdminUser` en `drivers`, `transports`) |
| `test_integration.py` | Cuando hay flujos que cruzan dos o más modelos del mismo módulo (ej: crear shipment con items anidados) |

### Criterio para separar

Separar en archivo nuevo cuando:
- Un grupo de tests comparte un `setUp` diferente al del resto
- Los tests de una responsabilidad superan ~15 métodos
- Mezclar dos responsabilidades en el mismo archivo hace difícil encontrar un test específico

---

## Los tres casos obligatorios por endpoint

Nunca omitir ninguno de los tres:

| Caso | Qué significa | Ejemplo |
|---|---|---|
| **Happy path** | Input válido, resultado esperado | POST con datos correctos → 201 |
| **Unhappy path** | Input inválido o estado incorrecto | POST sin campo requerido → 400 |
| **Edge case** | Límites, nulls permitidos, valores extremos, conflictos | POST con email duplicado → 400, campo nullable → acepta null |

---

## Patrón base para tests de modelos

```python
from django.test import TestCase
from django.core.exceptions import ValidationError
from apps.<module>.models import <Model>


class <Model>ModelTest(TestCase):
    """Tests del modelo <Model>."""

    def setUp(self):
        # Mock data mínimo para crear una instancia válida
        self.<instance> = <Model>.objects.create(
            <campo>='<valor>',
            # ...campos requeridos
        )

    # --- Happy path ---
    def test_create_<model>_success(self):
        """Crear instancia con datos válidos."""
        self.assertIsNotNone(self.<instance>.id)
        self.assertEqual(self.<instance>.<campo>, '<valor>')

    def test_auto_timestamps(self):
        """created_at y updated_at se asignan automáticamente."""
        self.assertIsNotNone(self.<instance>.created_at)
        self.assertIsNotNone(self.<instance>.updated_at)

    # --- Unhappy path ---
    def test_<campo>_required(self):
        """Campo requerido no puede ser vacío."""
        obj = <Model>(<campo>='')
        with self.assertRaises(ValidationError):
            obj.full_clean()

    # --- Edge case ---
    def test_<campo>_unique_constraint(self):
        """No se pueden crear dos instancias con el mismo valor único."""
        with self.assertRaises(Exception):
            <Model>.objects.create(<campo>=self.<instance>.<campo>)
```

---

## Patrón base para tests de vistas (DRF + JWT)

```python
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from apps.<module>.models import <Model>


class <Model>ViewSetTest(APITestCase):
    """Tests de endpoints /api/v1/<resource>/."""

    def setUp(self):
        # Crear usuario y autenticar — obligatorio porque todos los endpoints requieren JWT
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

        # Mock data base
        self.<instance> = <Model>.objects.create(
            <campo>='<valor>',
        )
        self.valid_payload = {
            '<campo>': '<valor>',
        }
        self.invalid_payload = {
            '<campo_requerido>': '',  # vacío → 400
        }
        self.url_list = '/api/v1/<resource>/'
        self.url_detail = f'/api/v1/<resource>/{self.<instance>.id}/'

    # --- Happy path ---
    def test_list_<resource>(self):
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_<resource>_success(self):
        response = self.client.post(self.url_list, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_retrieve_<resource>(self):
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_<resource>(self):
        response = self.client.put(self.url_detail, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_partial_update_<resource>(self):
        response = self.client.patch(self.url_detail, {'<campo>': 'nuevo_valor'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_<resource>(self):
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    # --- Unhappy path ---
    def test_create_<resource>_invalid_data(self):
        response = self.client.post(self.url_list, self.invalid_payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_<resource>_not_found(self):
        response = self.client.get('/api/v1/<resource>/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_request(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Edge case ---
    def test_list_<resource>_empty(self):
        <Model>.objects.all().delete()
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Con paginación DRF, la lista vacía viene en 'results'
        self.assertEqual(len(response.data.get('results', response.data)), 0)
```

---

## Casos especiales por módulo

### `drivers` — FK OneToOne con User
```python
# setUp: crear User separado para el driver
self.driver_user = User.objects.create_user(username='driver1', password='pass')
self.driver = Driver.objects.create(user=self.driver_user, license_number='ABC123', ...)
```

### `transports` — FK nullable a drivers
```python
# Edge case: crear transport sin driver
def test_create_transport_without_driver(self):
    payload = {**self.valid_payload, 'driver': None}
    response = self.client.post(self.url_list, payload, format='json')
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertIsNone(response.data['driver'])
```

### `warehouses` — acción custom stock
```python
def test_get_stock_empty(self):
    url = f'/api/v1/warehouses/{self.warehouse.id}/stock/'
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)

def test_get_stock_not_found(self):
    response = self.client.get('/api/v1/warehouses/99999/stock/')
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
```

### `routes` — sub-recurso stops
```python
def test_list_stops(self):
    url = f'/api/v1/routes/{self.route.id}/stops/'
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)

def test_create_stop(self):
    url = f'/api/v1/routes/{self.route.id}/stops/'
    response = self.client.post(url, self.valid_stop_payload, format='json')
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
```

### `shipments` — escritura anidada + transiciones de estado
```python
# Happy path: crear shipment con items
def test_create_shipment_with_items(self):
    payload = {
        **self.valid_payload,
        'items': [{'product': self.product.id, 'quantity': 2}]
    }
    response = self.client.post(self.url_list, payload, format='json')
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)

# Happy path: transición válida pending → processing
def test_valid_status_transition(self):
    url = f'/api/v1/shipments/{self.shipment.id}/status/'
    response = self.client.patch(url, {'status': 'processing'}, format='json')
    self.assertEqual(response.status_code, status.HTTP_200_OK)

# Unhappy path: transición inválida
def test_invalid_status_transition(self):
    url = f'/api/v1/shipments/{self.shipment.id}/status/'
    response = self.client.patch(url, {'status': 'delivered'}, format='json')
    self.assertIn(response.status_code, [
        status.HTTP_400_BAD_REQUEST,
        status.HTTP_422_UNPROCESSABLE_ENTITY,
    ])

# Edge case: transición desde delivered (estado terminal)
def test_transition_from_terminal_state(self):
    self.shipment.status = 'delivered'
    self.shipment.save()
    url = f'/api/v1/shipments/{self.shipment.id}/status/'
    response = self.client.patch(url, {'status': 'processing'}, format='json')
    self.assertNotEqual(response.status_code, status.HTTP_200_OK)
```

---

## Flujo obligatorio por módulo

```
1. Leer docs/database-schema.md y docs/architecture.md
2. Leer el modelo, serializer y views del módulo a testear
3. Identificar: campos requeridos, nullable, unique; endpoints; acciones custom
4. Escribir tests en tests.py (o tests/ si ya existe la carpeta)
   - Sección modelos: happy path, unhappy path, edge case
   - Sección vistas: cada endpoint × 3 casos
5. Activar .venv y ejecutar tests del módulo:
   .venv\Scripts\Activate.ps1
   python manage.py test apps.<module> --verbosity=2
6. Si hay errores: leer el traceback, corregir el test file, volver al paso 5
7. Cuando todos pasen: ejecutar cobertura del módulo:
   coverage run --source=apps.<module> manage.py test apps.<module>
   coverage report --fail-under=80
8. Si cobertura < 80%: identificar líneas sin cubrir (coverage report -m), agregar tests, volver al paso 5
9. Generar reporte HTML global:
   coverage run --source=apps manage.py test
   coverage html
   # Reporte en: htmlcov/index.html
10. Reportar al usuario: tests pasados, cobertura obtenida, ruta del reporte HTML
```

---

## Comandos de referencia

```powershell
# Activar entorno virtual (siempre primero)
.venv\Scripts\Activate.ps1

# Ejecutar tests de un módulo con detalle
python manage.py test apps.<module> --verbosity=2

# Ejecutar tests de un TestCase específico
python manage.py test apps.<module>.tests.<TestClassName>

# Ejecutar un test específico
python manage.py test apps.<module>.tests.<TestClassName>.<test_method>

# Cobertura de un módulo
coverage run --source=apps.<module> manage.py test apps.<module>
coverage report -m --fail-under=80

# Cobertura completa del proyecto (solo al final)
coverage run --source=apps manage.py test
coverage html
# Abrir htmlcov/index.html en el navegador
```

---

## Checklist antes de declarar un módulo testeado

- [ ] Tests de modelos: creación exitosa, campos requeridos, restricciones unique, timestamps
- [ ] Tests de vistas: list, create, retrieve, update, partial_update, destroy
- [ ] Test de request no autenticada → 401 en cada recurso
- [ ] Test de recurso no encontrado → 404
- [ ] Tests de acciones custom del módulo (si aplica)
- [ ] Todos los tests pasan sin errores
- [ ] Cobertura ≥ 80% del módulo
- [ ] Reporte HTML generado en `htmlcov/`

---

## Lo que NO debes hacer

- Testear más de un módulo en una sola ejecución sin confirmación del usuario
- Ejecutar `python manage.py runserver`
- Hacer `fetch` o llamadas HTTP reales — usar `self.client` de `APITestCase`
- Mockear la base de datos — Django TestCase usa una DB de test real en SQLite
- Asumir el comportamiento de un endpoint sin leer su implementación en `views.py`
- Dejar tests con `pass` o sin assertions
- Generar el reporte HTML sin que todos los tests del módulo pasen primero

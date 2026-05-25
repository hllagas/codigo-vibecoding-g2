---
name: implement
description: Agente de implementación SDD. Lee spec/<module>.md y escribe el código Django siguiendo architecture.md y database-schema.md. Se activa después de que el agente Spec crea el spec del módulo.
---

# Implement Agent — Implementación de módulos

## Rol

Leer el spec de un módulo en `spec/<module>.md` y escribir el código Django correspondiente. Cada tarea del spec genera uno o más archivos Python. No creas archivos de test en esta etapa.

## Documentos que debes leer antes de implementar

1. `spec/<module>.md` — tareas exactas a ejecutar
2. `docs/architecture.md` — patrones obligatorios (ModelViewSet, DefaultRouter, TextChoices, configuración DRF)
3. `docs/database-schema.md` — nombres de campos, tipos, restricciones, FKs

## Estructura de apps — regla obligatoria

**Todas las apps viven dentro de `apps/`**, nunca en la raíz del proyecto.

```bash
# Crear app
python manage.py startapp <name> apps/<name>

# Después del startapp, actualizar apps/<name>/apps.py:
# name = 'apps.<name>'    ← obligatorio, Django falla si no se hace
```

```python
# INSTALLED_APPS
'apps.suppliers',

# config/urls.py
path('', include('apps.suppliers.urls')),

# Importar modelo de otra app
from apps.suppliers.models import Supplier

# FK con string — app_label es el último segmento
models.ForeignKey('suppliers.Supplier', on_delete=models.PROTECT)
```

## Convenciones obligatorias

### Idioma
- Código (nombres de clases, métodos, variables, campos): **inglés**
- Comentarios en el código: **español**
- Solo añadir comentarios cuando el "por qué" no es obvio

### Modelos
```python
class MyModel(models.Model):
    # Enums siempre como TextChoices
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Activo'

    name = models.CharField(max_length=255)
    # ...campos exactos del schema
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = '<table_name>'  # nombre exacto del schema
        ordering = ['<campo>']
```

### Serializers
```python
class MyModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = MyModel
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
```

### ViewSets
```python
class MyModelViewSet(viewsets.ModelViewSet):
    queryset = MyModel.objects.filter(is_active=True)  # si tiene is_active
    serializer_class = MyModelSerializer
    filterset_fields = ['campo1', 'campo2']
    search_fields = ['nombre', 'email']
    ordering_fields = ['nombre', 'created_at']
```

### URLs del módulo
```python
from rest_framework.routers import DefaultRouter
from .views import MyModelViewSet

router = DefaultRouter()
router.register(r'resource-name', MyModelViewSet)
urlpatterns = router.urls
```

### Registro en config/urls.py
```python
path('', include('module_name.urls')),
```

## Checklist antes de declarar una tarea completada

- [ ] Los nombres de campos coinciden exactamente con `docs/database-schema.md`
- [ ] Los tipos de campo son correctos (CharField, DecimalField, DateField, etc.)
- [ ] Las restricciones están aplicadas (unique=True, null=True, blank=True, default=)
- [ ] Las FKs usan `on_delete=models.PROTECT` salvo que el schema indique otra cosa
- [ ] Los enums usan `TextChoices`
- [ ] `db_table` está definido en `Meta`
- [ ] El módulo está en `INSTALLED_APPS`
- [ ] Las URLs están incluidas en `config/urls.py` bajo `/api/v1/`
- [ ] No hay imports sin usar
- [ ] No hay lógica de negocio en serializers que debería estar en el modelo o viceversa

## Acciones custom (patrones)

### Cambio de estado (shipments)
```python
@action(detail=True, methods=['patch'], url_path='status')
def update_status(self, request, pk=None):
    # Validar transición permitida antes de guardar
```

### Sub-recurso (route_stops)
```python
@action(detail=True, methods=['get', 'post'], url_path='stops')
def stops(self, request, pk=None):
    ...
```

### Stock de almacén
```python
@action(detail=True, methods=['get'], url_path='stock')
def stock(self, request, pk=None):
    ...
```

## Lo que NO debes hacer

- Agregar campos que no estén en `docs/database-schema.md`
- Usar `on_delete=models.CASCADE` en FKs a entidades de negocio sin verificar el schema
- Crear archivos de test
- Cambiar el prefijo `/api/v1/` definido en `docs/architecture.md`
- Usar `APIView` en lugar de `ModelViewSet` para CRUD estándar

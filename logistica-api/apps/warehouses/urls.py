from rest_framework.routers import DefaultRouter

from .views import WarehouseViewSet

# Router genera automáticamente los endpoints CRUD para warehouses
# incluyendo la acción custom GET /warehouses/{id}/stock/
router = DefaultRouter()
router.register(r'warehouses', WarehouseViewSet)

urlpatterns = router.urls

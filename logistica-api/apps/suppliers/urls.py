from rest_framework.routers import DefaultRouter

from .views import SupplierViewSet

# Router genera automáticamente los endpoints CRUD para suppliers
router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet)

urlpatterns = router.urls

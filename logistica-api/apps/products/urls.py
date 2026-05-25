from rest_framework.routers import DefaultRouter

from .views import ProductViewSet

router = DefaultRouter()
# Registra /api/v1/products/ con todos los endpoints CRUD estándar
router.register(r'products', ProductViewSet)

urlpatterns = router.urls

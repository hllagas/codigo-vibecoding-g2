from rest_framework.routers import DefaultRouter

from .views import DriverViewSet

router = DefaultRouter()
router.register(r'drivers', DriverViewSet)

urlpatterns = router.urls

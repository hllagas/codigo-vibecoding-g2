from rest_framework.routers import DefaultRouter

from .views import RouteViewSet

router = DefaultRouter()
router.register(r'routes', RouteViewSet)

urlpatterns = router.urls

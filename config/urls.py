"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework.routers import DefaultRouter

from transactions.views import (
    CategoryViewSet,
    SubcategoryViewSet,
    TransactionViewSet,
)
from wallets.views import AccountViewSet, PurposeViewSet

router = DefaultRouter()
router.register("purposes", PurposeViewSet)
router.register("accounts", AccountViewSet)
router.register("categories", CategoryViewSet)
router.register("subcategories", SubcategoryViewSet)
router.register("transactions", TransactionViewSet, basename="transaction")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authn.urls')),
    path('api/', include(router.urls)),
    # OpenAPI schema + interactive docs.
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path(
        'api/docs/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui',
    ),
    path(
        'api/redoc/',
        SpectacularRedocView.as_view(url_name='schema'),
        name='redoc',
    ),
]

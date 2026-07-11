from django.urls import path

from .views import CSRFView, LoginView, LogoutView, MeView, RefreshView

urlpatterns = [
    path("csrf/", CSRFView.as_view(), name="auth-csrf"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/", MeView.as_view(), name="auth-me"),
]

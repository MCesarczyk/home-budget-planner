from django.urls import path

from .views import CashflowView, NetWorthView, PurposesView, SpendingView

urlpatterns = [
    path("net-worth/", NetWorthView.as_view(), name="report-net-worth"),
    path("spending/", SpendingView.as_view(), name="report-spending"),
    path("cashflow/", CashflowView.as_view(), name="report-cashflow"),
    path("purposes/", PurposesView.as_view(), name="report-purposes"),
]

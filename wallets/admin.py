from django.contrib import admin

from .models import Account, Purpose


@admin.register(Purpose)
class PurposeAdmin(admin.ModelAdmin):
    list_display = ("name", "target_amount")
    search_fields = ("name",)


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ("name", "type", "opening_balance", "purpose", "is_active")
    list_filter = ("type", "is_active", "purpose")
    search_fields = ("name",)

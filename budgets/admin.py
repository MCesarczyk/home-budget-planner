from django.contrib import admin

from .models import BudgetItem, BudgetPlan


class BudgetItemInline(admin.TabularInline):
    model = BudgetItem
    extra = 0
    autocomplete_fields = ("subcategory",)


@admin.register(BudgetPlan)
class BudgetPlanAdmin(admin.ModelAdmin):
    list_display = ("month",)
    ordering = ("-month",)
    inlines = [BudgetItemInline]

from django.contrib import admin

from .models import Category, Subcategory, Transaction


class SubcategoryInline(admin.TabularInline):
    model = Subcategory
    extra = 0


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "kind")
    list_filter = ("kind",)
    search_fields = ("name",)
    inlines = [SubcategoryInline]


@admin.register(Subcategory)
class SubcategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "category")
    list_filter = ("category__kind", "category")
    search_fields = ("name", "category__name")


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        "tx_date",
        "kind",
        "subcategory",
        "source_account",
        "destination_account",
        "amount",
    )
    list_filter = ("subcategory__category__kind", "subcategory__category")
    search_fields = ("subcategory__name", "subcategory__category__name")
    date_hierarchy = "tx_date"
    ordering = ("-tx_date",)

    @admin.display(description="kind")
    def kind(self, obj):
        if obj.source_account_id and obj.destination_account_id:
            return "transfer"
        return "income" if obj.destination_account_id else "expense"

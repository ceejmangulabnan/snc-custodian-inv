<template>
    <div class="space-y-6">
        <!-- Page header -->
        <div
            class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div class="flex items-start gap-4">
                <div
                    class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 via-green-600 to-teal-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
                >
                    <UIcon name="i-lucide-boxes" class="size-7" />
                </div>

                <div>
                    <h1
                        class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
                    >
                        Manage Inventory
                    </h1>

                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Track stock levels, categories, and restocking needs.
                    </p>
                </div>
            </div>

            <UButton
                color="primary"
                size="lg"
                icon="i-lucide-plus"
                class="rounded-2xl shadow-lg shadow-green-500/20"
            >
                Add Item
            </UButton>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div
                v-for="stat in stats"
                :key="stat.label"
                class="group relative overflow-hidden rounded-3xl border border-green-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
                <div class="relative flex items-center justify-between">
                    <div>
                        <p
                            class="text-sm font-medium text-slate-500 dark:text-slate-400"
                        >
                            {{ stat.label }}
                        </p>

                        <p
                            class="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
                        >
                            {{ stat.value }}
                        </p>
                    </div>

                    <div
                        class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg"
                        :class="stat.tint"
                    >
                        <UIcon :name="stat.icon" class="size-6" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Inventory table -->
        <div
            class="overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
            <!-- Table header -->
            <div
                class="flex flex-col gap-4 border-b border-green-100 p-5 lg:flex-row lg:items-center lg:justify-between dark:border-slate-700"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-400"
                    >
                        <UIcon name="i-lucide-list" class="size-5" />
                    </div>

                    <div>
                        <h2
                            class="text-base font-semibold text-slate-900 dark:text-white"
                        >
                            Inventory Items
                        </h2>

                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            {{ filteredByCategory.length }} of
                            {{ sampleInventory.length }} items shown
                        </p>
                    </div>
                </div>

                <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <UInput
                        v-model="search"
                        icon="i-lucide-search"
                        placeholder="Search name, SKU, category..."
                        size="lg"
                        class="w-full sm:w-72"
                    />

                    <USelect
                        v-model="category"
                        :items="categoryOptions"
                        size="lg"
                        class="w-full sm:w-56"
                    />
                </div>
            </div>

            <!-- Table -->
            <UTable
                :data="filteredByCategory"
                :columns="columns"
                v-model:global-filter="search"
                v-model:sorting="sorting"
                :empty="'No items match your filters.'"
                class="flex-1"
            >
                <template #stockQty-cell="{ row }">
                    <span
                        :class="
                            row.original.stockQty <= row.original.minThreshold
                                ? 'font-semibold text-red-600 dark:text-red-400'
                                : 'font-medium text-slate-700 dark:text-slate-200'
                        "
                    >
                        {{ row.original.stockQty }}
                    </span>
                </template>

                <template #status-cell="{ row }">
                    <UBadge
                        :color="
                            row.original.stockQty > row.original.minThreshold
                                ? 'success'
                                : 'error'
                        "
                        variant="subtle"
                        :icon="
                            row.original.stockQty > row.original.minThreshold
                                ? 'i-lucide-circle-check'
                                : 'i-lucide-alert-triangle'
                        "
                    >
                        {{
                            row.original.stockQty > row.original.minThreshold
                                ? 'Healthy'
                                : 'Needs Restocking'
                        }}
                    </UBadge>
                </template>
            </UTable>

            <!-- Table footer -->
            <div
                class="flex items-center justify-between border-t border-green-100 px-5 py-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"
            >
                <p>{{ lowStockItems.length }} items need restocking</p>

                <p>Updated just now</p>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { SortingState } from '@tanstack/vue-table'
import type { InventoryItem } from '#shared/types/inventory'
import { sampleInventory as sampleInventoryData } from '#shared/data/inventory'

definePageMeta({
    layout: 'admin',
    middleware: 'admin',
})

const sampleInventory = ref<InventoryItem[]>(sampleInventoryData)

/*
|--------------------------------------------------------------------------
| Filters
|--------------------------------------------------------------------------
*/

const search = ref('')
const category = ref('all')
const sorting = ref<SortingState>([])

const categories = computed(() => {
    return [
        ...new Set(sampleInventory.value.map((item) => item.category)),
    ].sort()
})

console.log('Categories: ', categories.value)

const categoryOptions = computed(() => [
    { label: 'All Categories', value: 'all' },
    ...categories.value.map((item) => ({ label: item, value: item })),
])

const filteredByCategory = computed(() => {
    if (category.value === 'all') {
        return sampleInventory.value
    }

    return sampleInventory.value.filter(
        (item) => item.category === category.value
    )
})

/*
|--------------------------------------------------------------------------
| Stats
|--------------------------------------------------------------------------
*/

// TODO: Should be fetched from backend
const totalUnits = computed(() =>
    sampleInventory.value.reduce((sum, item) => sum + item.stockQty, 0)
)

const lowStockItems = computed(() =>
    sampleInventory.value.filter((item) => item.stockQty <= item.minThreshold)
)

const stats = computed(() => [
    {
        label: 'Total Items',
        value: sampleInventory.value.length,
        icon: 'i-lucide-boxes',
        tint: 'from-green-500 via-green-600 to-teal-600',
    },
    {
        label: 'Units in Stock',
        value: totalUnits.value,
        icon: 'i-lucide-package',
        tint: 'from-blue-500 to-indigo-600',
    },
    {
        label: 'Low Stock Items',
        value: lowStockItems.value.length,
        icon: 'i-lucide-alert-triangle',
        tint: 'from-red-500 to-rose-600',
    },
    {
        label: 'Categories',
        value: categories.value.length,
        icon: 'i-lucide-tags',
        tint: 'from-amber-500 to-orange-600',
    },
])

/*
|--------------------------------------------------------------------------
| Table
|--------------------------------------------------------------------------
*/

const columns: TableColumn<InventoryItem>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
        enableSorting: false,
    },
    {
        accessorKey: 'sku',
        header: 'SKU',
    },
    {
        accessorKey: 'name',
        header: 'Item Name',
    },
    {
        accessorKey: 'category',
        header: 'Category',
    },
    {
        accessorKey: 'stockQty',
        header: 'In Stock',
    },
    {
        accessorKey: 'minThreshold',
        header: 'Min. Threshold',
    },
    {
        accessorKey: 'unit',
        header: 'Unit',
    },
    {
        id: 'status',
        header: 'Status',
        enableSorting: false,
    },
]
</script>

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

            <div class="flex flex-col gap-3 sm:flex-row">
                <UButton
                    color="neutral"
                    size="lg"
                    variant="soft"
                    icon="i-lucide-tags"
                    class="rounded-2xl"
                    @click="categoriesOpen = true"
                >
                    Manage Categories
                </UButton>

                <UButton
                    color="primary"
                    size="lg"
                    icon="i-lucide-plus"
                    class="rounded-2xl shadow-lg shadow-green-500/20"
                    @click="openItemCreate"
                >
                    Add Item
                </UButton>
            </div>
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

        <!-- Fetch error -->
        <UAlert
            v-if="fetchError"
            color="error"
            variant="soft"
            icon="i-lucide-triangle-alert"
            :title="errorMessage"
            description="Check that the backend is running and try again."
            :actions="[
                {
                    label: 'Retry',
                    icon: 'i-lucide-refresh-cw',
                    color: 'error',
                    variant: 'outline',
                    onClick: () => refresh(),
                },
            ]"
        />

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
                            {{ filteredItems.length }} of
                            {{ inventoryItems.length }} items shown
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
                :data="filteredItems"
                :columns="columns"
                :loading="pending"
                :pagination-options="{
                    getPaginationRowModel: getPaginationRowModel(),
                }"
                v-model:sorting="sorting"
                v-model:pagination="pagination"
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

                <template #actions-cell="{ row }">
                    <UDropdownMenu
                        :items="getItemActions(row.original)"
                        :ui="{
                            content: 'w-48',
                            itemLeadingIcon: 'size-4',
                        }"
                    >
                        <UButton
                            icon="i-lucide-ellipsis-vertical"
                            color="neutral"
                            variant="ghost"
                        />
                    </UDropdownMenu>
                </template>
            </UTable>

            <!-- Table footer -->
            <div
                class="flex flex-col gap-4 border-t border-green-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between dark:border-slate-700"
            >
                <p class="text-xs text-slate-500 dark:text-slate-400">
                    {{ filteredItems.length }} items
                    <span class="text-slate-400 dark:text-slate-500">
                        · {{ lowStockItems.length }} need restocking
                    </span>
                </p>

                <div class="flex items-center justify-between gap-4">
                    <USelect
                        v-model="pageSize"
                        :items="pageSizeOptions"
                        size="sm"
                        class="w-32"
                    />

                    <UPagination
                        v-model:page="page"
                        :total="filteredItems.length"
                        :items-per-page="pagination.pageSize"
                        :show-edges="true"
                        :show-controls="true"
                        size="sm"
                    />
                </div>
            </div>
        </div>

        <!-- Create / Edit item modal -->
        <UModal v-model:open="itemFormOpen" :ui="{ content: 'rounded-[28px]' }">
            <template #content>
                <div
                    class="relative overflow-hidden rounded-[28px] border border-green-100 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90"
                >
                    <div class="flex items-start gap-4">
                        <div
                            class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-green-500 via-green-600 to-teal-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
                        >
                            <UIcon
                                :name="
                                    isEditingItem
                                        ? 'i-lucide-pen'
                                        : 'i-lucide-package-plus'
                                "
                                class="size-5"
                            />
                        </div>

                        <div>
                            <h2
                                class="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                            >
                                {{ isEditingItem ? 'Edit Item' : 'Add Item' }}
                            </h2>

                            <p
                                class="mt-0.5 text-sm text-slate-500 dark:text-slate-400"
                            >
                                <template v-if="isEditingItem">
                                    Editing
                                    <span
                                        class="font-medium text-slate-700 dark:text-slate-300"
                                    >
                                        {{ selectedItem?.name }}
                                    </span>
                                </template>
                                <template v-else>
                                    Add a new inventory item.
                                </template>
                            </p>
                        </div>
                    </div>

                    <UAlert
                        v-if="itemFormError"
                        color="error"
                        variant="soft"
                        icon="i-lucide-alert-circle"
                        :title="itemFormError"
                        class="mt-5"
                    />

                    <UForm class="mt-6 space-y-4" :state="itemForm">
                        <UFormField label="Item Name">
                            <UInput
                                v-model="itemForm.name"
                                icon="i-lucide-package"
                                placeholder="e.g. Bond Paper - Letter"
                                class="w-full"
                            />
                        </UFormField>

                        <div class="grid grid-cols-2 gap-4">
                            <UFormField label="SKU">
                                <UInput
                                    v-model="itemForm.sku"
                                    icon="i-lucide-barcode"
                                    placeholder="e.g. PAP-101"
                                    class="w-full"
                                />
                            </UFormField>

                            <UFormField label="Unit">
                                <UInput
                                    v-model="itemForm.unit"
                                    icon="i-lucide-ruler"
                                    placeholder="e.g. Rim, Box, Each"
                                    class="w-full"
                                />
                            </UFormField>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <UFormField label="Stock Quantity">
                                <UInput
                                    v-model.number="itemForm.stockQty"
                                    type="number"
                                    min="0"
                                    icon="i-lucide-boxes"
                                    class="w-full"
                                />
                            </UFormField>

                            <UFormField label="Min. Threshold">
                                <UInput
                                    v-model.number="itemForm.minThreshold"
                                    type="number"
                                    min="0"
                                    icon="i-lucide-triangle-alert"
                                    class="w-full"
                                />
                            </UFormField>
                        </div>

                        <UFormField label="Category">
                            <USelectMenu
                                v-model.number="itemForm.categoryId"
                                v-model:search-term="categorySearch"
                                :open="categoryMenuOpen"
                                :items="categoryMenuItems"
                                :create-item="{ position: 'top' }"
                                value-key="id"
                                icon="i-lucide-tags"
                                placeholder="Select a category..."
                                :loading="creatingCategory"
                                class="w-full"
                                @update:open="categoryMenuOpen = $event"
                                @create="createCategoryFromMenu"
                            >
                                <template #create-item-label="{ item }">
                                    Create category "{{ item }}"
                                </template>
                            </USelectMenu>
                        </UFormField>
                    </UForm>

                    <div class="mt-6 flex justify-end gap-3">
                        <UButton
                            color="neutral"
                            variant="outline"
                            @click="itemFormOpen = false"
                        >
                            Cancel
                        </UButton>

                        <UButton
                            color="success"
                            icon="i-lucide-check"
                            :loading="savingItem"
                            @click="saveItem"
                        >
                            {{ isEditingItem ? 'Save' : 'Add Item' }}
                        </UButton>
                    </div>
                </div>
            </template>
        </UModal>

        <!-- Delete item modal -->
        <UModal
            v-model:open="itemDeleteOpen"
            :ui="{ content: 'rounded-[28px]' }"
        >
            <template #content>
                <div
                    class="relative overflow-hidden rounded-[28px] border border-red-100 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-red-900/50 dark:bg-slate-900/90"
                >
                    <div class="flex items-start gap-4">
                        <div
                            class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-red-500 via-red-600 to-rose-600 text-white shadow-[0_10px_30px_rgba(239,68,68,0.35)]"
                        >
                            <UIcon name="i-lucide-trash" class="size-5" />
                        </div>

                        <div>
                            <h2
                                class="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                            >
                                Delete Item
                            </h2>

                            <p
                                class="mt-0.5 text-sm text-slate-500 dark:text-slate-400"
                            >
                                Are you sure you want to delete
                                <span
                                    class="font-medium text-slate-700 dark:text-slate-300"
                                >
                                    {{ itemToDelete?.name }}
                                </span>
                                ? This action cannot be undone.
                            </p>
                        </div>
                    </div>

                    <UAlert
                        v-if="itemDeleteError"
                        color="error"
                        variant="soft"
                        icon="i-lucide-alert-circle"
                        :title="itemDeleteError"
                        class="mt-5"
                    />

                    <div class="mt-6 flex justify-end gap-3">
                        <UButton
                            color="neutral"
                            variant="outline"
                            @click="itemDeleteOpen = false"
                        >
                            Cancel
                        </UButton>

                        <UButton
                            color="error"
                            icon="i-lucide-trash"
                            :loading="deletingItem"
                            @click="confirmItemDelete"
                        >
                            Delete
                        </UButton>
                    </div>
                </div>
            </template>
        </UModal>

        <!-- Manage categories modal -->
        <UModal
            v-model:open="categoriesOpen"
            :ui="{ content: 'rounded-[28px]' }"
        >
            <template #content>
                <div
                    class="relative overflow-hidden rounded-[28px] border border-green-100 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90"
                >
                    <div class="flex items-start gap-4">
                        <div
                            class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-[0_10px_30px_rgba(245,158,11,0.35)]"
                        >
                            <UIcon name="i-lucide-tags" class="size-5" />
                        </div>

                        <div>
                            <h2
                                class="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                            >
                                Manage Categories
                            </h2>

                            <p
                                class="mt-0.5 text-sm text-slate-500 dark:text-slate-400"
                            >
                                Add, rename, or remove item categories.
                            </p>
                        </div>
                    </div>

                    <UAlert
                        v-if="categoryError"
                        color="error"
                        variant="soft"
                        icon="i-lucide-alert-circle"
                        :title="categoryError"
                        class="mt-5"
                    />

                    <!-- Add category -->
                    <div class="mt-6 flex gap-2">
                        <UInput
                            v-model="newCategoryName"
                            icon="i-lucide-plus"
                            placeholder="New category name..."
                            class="flex-1"
                            @keydown.enter="addCategory"
                        />

                        <UButton
                            color="success"
                            icon="i-lucide-plus"
                            :loading="savingCategory"
                            @click="addCategory"
                        >
                            Add
                        </UButton>
                    </div>

                    <!-- Category list -->
                    <ul
                        v-if="apiCategories.length"
                        class="mt-4 divide-y divide-green-100 overflow-hidden rounded-2xl border border-green-100 dark:divide-slate-700 dark:border-slate-700"
                    >
                        <li
                            v-for="cat in apiCategories"
                            :key="cat.id"
                            class="flex items-center gap-3 px-4 py-3"
                        >
                            <UIcon
                                name="i-lucide-tag"
                                class="size-4 shrink-0 text-amber-500"
                            />

                            <template v-if="categoryEditingId === cat.id">
                                <UInput
                                    v-model="categoryEditingName"
                                    size="sm"
                                    class="flex-1"
                                    @keydown.enter="saveCategoryRename(cat)"
                                    @keydown.esc="cancelCategoryEdit"
                                />

                                <UButton
                                    size="sm"
                                    color="success"
                                    variant="soft"
                                    icon="i-lucide-check"
                                    :loading="savingCategory"
                                    @click="saveCategoryRename(cat)"
                                />
                            </template>

                            <template v-else>
                                <span
                                    class="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-200"
                                >
                                    {{ cat.name }}
                                </span>

                                <span
                                    class="shrink-0 text-xs text-slate-500 dark:text-slate-400"
                                >
                                    {{ itemCountFor(cat.name) }} items
                                </span>

                                <UButton
                                    size="sm"
                                    color="neutral"
                                    variant="ghost"
                                    icon="i-lucide-pen"
                                    aria-label="Rename category"
                                    @click="startCategoryEdit(cat)"
                                />

                                <UButton
                                    size="sm"
                                    color="error"
                                    variant="ghost"
                                    icon="i-lucide-trash"
                                    aria-label="Delete category"
                                    @click="openCategoryDelete(cat)"
                                />
                            </template>
                        </li>
                    </ul>

                    <div
                        v-else
                        class="mt-4 rounded-2xl border border-dashed border-green-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400"
                    >
                        No categories yet. Add one above.
                    </div>
                </div>
            </template>
        </UModal>

        <!-- Delete category modal -->
        <UModal
            v-model:open="categoryDeleteOpen"
            :ui="{ content: 'rounded-[28px]' }"
        >
            <template #content>
                <div
                    class="relative overflow-hidden rounded-[28px] border border-red-100 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-red-900/50 dark:bg-slate-900/90"
                >
                    <div class="flex items-start gap-4">
                        <div
                            class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-red-500 via-red-600 to-rose-600 text-white shadow-[0_10px_30px_rgba(239,68,68,0.35)]"
                        >
                            <UIcon name="i-lucide-trash" class="size-5" />
                        </div>

                        <div>
                            <h2
                                class="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                            >
                                Delete Category
                            </h2>

                            <p
                                class="mt-0.5 text-sm text-slate-500 dark:text-slate-400"
                            >
                                Delete
                                <span
                                    class="font-medium text-slate-700 dark:text-slate-300"
                                >
                                    {{ categoryToDelete?.name }}
                                </span>
                                ?
                            </p>
                        </div>
                    </div>

                    <div
                        v-if="categoryToDelete"
                        class="mt-6 rounded-2xl border border-red-100 bg-red-50/60 p-4 text-sm text-slate-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-slate-300"
                    >
                        {{ itemCountFor(categoryToDelete.name) }} item(s) in
                        this category will become
                        <span class="font-semibold">Uncategorized</span>.
                    </div>

                    <UAlert
                        v-if="categoryDeleteError"
                        color="error"
                        variant="soft"
                        icon="i-lucide-alert-circle"
                        :title="categoryDeleteError"
                        class="mt-5"
                    />

                    <div class="mt-6 flex justify-end gap-3">
                        <UButton
                            color="neutral"
                            variant="outline"
                            @click="categoryDeleteOpen = false"
                        >
                            Cancel
                        </UButton>

                        <UButton
                            color="error"
                            icon="i-lucide-trash"
                            :loading="deletingCategory"
                            @click="confirmCategoryDelete"
                        >
                            Delete
                        </UButton>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>
<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { DropdownMenuItem } from '#ui/types'
import { getPaginationRowModel, type SortingState } from '@tanstack/vue-table'
import type { InventoryItem } from '#shared/types/inventory'

definePageMeta({
    layout: 'admin',
    middleware: 'admin',
})

/*
|--------------------------------------------------------------------------
| Strapi data
|--------------------------------------------------------------------------
*/

interface StrapiItem {
    id: number
    documentId: string
    name: string
    sku: string
    stockQty: number
    minThreshold: number
    unit: string
    category: {
        id: number
        name: string
    } | null
}

interface Category {
    id: number
    documentId: string
    name: string
}

const strapi = useStrapi()
const toast = useToast()

const {
    data: itemsResponse,
    error: fetchError,
    pending,
    refresh,
} = await useAsyncData('fetchInventoryItems', () =>
    strapi.get<{ data: StrapiItem[] }>('/items', {
        populate: 'category',
        sort: 'id',
    })
)

console.log(itemsResponse.value)

const { data: categoriesResponse, refresh: refreshCategories } =
    await useAsyncData('fetchCategories', () =>
        strapi.get<{ data: Category[] }>('/categories', { sort: 'name' })
    )

const apiCategories = computed<Category[]>(() => {
    return categoriesResponse.value?.data ?? []
})

const inventoryItems = computed<InventoryItem[]>(() => {
    return (itemsResponse.value?.data ?? []).map((item) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        category: item.category?.name ?? 'Uncategorized',
        stockQty: item.stockQty,
        minThreshold: item.minThreshold,
        unit: item.unit,
        status: item.stockQty <= item.minThreshold ? 'low' : 'healthy',
    }))
})

const errorMessage = computed(() => {
    const err = fetchError.value as { data?: { statusMessage?: string } } | null
    return err?.data?.statusMessage ?? 'Failed to load inventory'
})

/*
|--------------------------------------------------------------------------
| Filters
|--------------------------------------------------------------------------
*/

const search = ref('')
const category = ref('all')
const sorting = ref<SortingState>([])

const pagination = ref({ pageIndex: 0, pageSize: 10 })

const page = computed({
    get: () => pagination.value.pageIndex + 1,
    set: (value: number) => {
        pagination.value.pageIndex = value - 1
    },
})

const pageSize = computed({
    get: () => pagination.value.pageSize,
    set: (value: number) => {
        pagination.value.pageSize = value
        pagination.value.pageIndex = 0
    },
})

const pageSizeOptions = [
    { label: '5 per page', value: 5 },
    { label: '10 per page', value: 10 },
    { label: '20 per page', value: 20 },
    { label: '50 per page', value: 50 },
]

const categories = computed(() => {
    return [
        ...new Set(inventoryItems.value.map((item) => item.category)),
    ].sort()
})

const categoryOptions = computed(() => [
    { label: 'All Categories', value: 'all' },
    ...categories.value.map((item) => ({ label: item, value: item })),
])

const filteredByCategory = computed(() => {
    if (category.value === 'all') {
        return inventoryItems.value
    }

    return inventoryItems.value.filter(
        (item) => item.category === category.value
    )
})

const filteredItems = computed(() => {
    const query = search.value.trim().toLowerCase()

    if (!query) {
        return filteredByCategory.value
    }

    return filteredByCategory.value.filter(
        (item) =>
            item.name.toLowerCase().includes(query) ||
            item.sku.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query)
    )
})

watch([search, category], () => {
    pagination.value.pageIndex = 0
})

/*
|--------------------------------------------------------------------------
| Stats
|--------------------------------------------------------------------------
*/

const totalUnits = computed(() =>
    inventoryItems.value.reduce((sum, item) => sum + item.stockQty, 0)
)

const lowStockItems = computed(() =>
    inventoryItems.value.filter((item) => item.stockQty <= item.minThreshold)
)

const stats = computed(() => [
    {
        label: 'Total Items',
        value: inventoryItems.value.length,
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
        value: apiCategories.value.length,
        icon: 'i-lucide-tags',
        tint: 'from-amber-500 to-orange-600',
    },
])

/*
|--------------------------------------------------------------------------
| Item table
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
    {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        meta: {
            class: {
                td: 'text-right pr-4',
                th: 'text-right pr-4',
            },
        },
    },
]

/*
|--------------------------------------------------------------------------
| Create / Edit item
|--------------------------------------------------------------------------
*/

const itemFormOpen = ref(false)
const selectedItem = ref<InventoryItem | null>(null)
const savingItem = ref(false)
const itemFormError = ref('')

const isEditingItem = computed(() => !!selectedItem.value)

const findStrapiItemById = (id: number): StrapiItem | undefined =>
    (itemsResponse.value?.data ?? []).find((item) => item.id === id)

const itemForm = ref({
    name: '',
    sku: '',
    unit: '',
    stockQty: 0,
    minThreshold: 0,
    categoryId: 0,
})

const categorySearch = ref('')
const categoryMenuOpen = ref(false)
const creatingCategory = ref(false)

const categoryMenuItems = computed(() => [
    { id: 0, label: 'Uncategorized' },
    ...apiCategories.value.map((cat) => ({ id: cat.id, label: cat.name })),
])

function resetItemForm() {
    itemForm.value = {
        name: '',
        sku: '',
        unit: '',
        stockQty: 0,
        minThreshold: 0,
        categoryId: 0,
    }
    categorySearch.value = ''
    categoryMenuOpen.value = false
    itemFormError.value = ''
}

function openItemCreate() {
    selectedItem.value = null
    resetItemForm()
    itemFormOpen.value = true
}

function openItemEdit(item: InventoryItem) {
    const raw = (itemsResponse.value?.data ?? []).find((i) => i.id === item.id)
    selectedItem.value = item
    itemForm.value = {
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        stockQty: item.stockQty,
        minThreshold: item.minThreshold,
        categoryId: raw?.category?.id ?? 0,
    }
    itemFormError.value = ''
    itemFormOpen.value = true
}

async function saveItem() {
    if (savingItem.value) return

    itemFormError.value = ''

    if (!itemForm.value.name.trim() || !itemForm.value.sku.trim()) {
        itemFormError.value = 'Item name and SKU are required.'
        return
    }

    if (!itemForm.value.unit.trim()) {
        itemFormError.value = 'Unit is required.'
        return
    }

    const body = {
        name: itemForm.value.name.trim(),
        sku: itemForm.value.sku.trim(),
        unit: itemForm.value.unit.trim(),
        stockQty: itemForm.value.stockQty || 0,
        minThreshold: itemForm.value.minThreshold || 0,
        category: itemForm.value.categoryId || null,
    }

    savingItem.value = true

    try {
        if (isEditingItem.value) {
            const documentId = findStrapiItemById(
                selectedItem.value?.id ?? 0
            )?.documentId

            if (!documentId) {
                throw new Error('Could not locate the item to update.')
            }

            await strapi.put(`/items/${documentId}`, {
                data: body,
            })
            toast.add({
                title: 'Item saved successfully',
                description: `Changes saved for item: ${itemForm.value.name.trim()}`,
            })
        } else {
            await strapi.post('/items', { data: body })
            toast.add({
                title: 'Item added successfully',
                description: `${itemForm.value.name.trim()} was added to inventory`,
            })
        }

        itemFormOpen.value = false
        await refresh()
    } catch (err) {
        itemFormError.value =
            (err as Error).message ?? 'Failed to save item. Please try again.'
    } finally {
        savingItem.value = false
    }
}

/*
|--------------------------------------------------------------------------
| Delete item
|--------------------------------------------------------------------------
*/

const itemDeleteOpen = ref(false)
const itemToDelete = ref<InventoryItem | null>(null)
const deletingItem = ref(false)
const itemDeleteError = ref('')

function openItemDelete(item: InventoryItem) {
    itemToDelete.value = item
    itemDeleteError.value = ''
    itemDeleteOpen.value = true
}

async function confirmItemDelete() {
    if (deletingItem.value || !itemToDelete.value) return

    deletingItem.value = true
    itemDeleteError.value = ''

    try {
        const documentId = findStrapiItemById(itemToDelete.value.id)?.documentId

        if (!documentId) {
            throw new Error('Could not locate the item to delete.')
        }

        await strapi.delete(`/items/${documentId}`)
        toast.add({
            title: 'Item deleted successfully',
            description: `${itemToDelete.value.name} was removed from inventory`,
        })
        itemDeleteOpen.value = false
        await refresh()
    } catch (err) {
        itemDeleteError.value =
            (err as Error).message ?? 'Failed to delete item. Please try again.'
    } finally {
        deletingItem.value = false
    }
}

function getItemActions(item: InventoryItem): DropdownMenuItem[] {
    return [
        {
            label: 'Edit',
            icon: 'i-lucide-pen',
            class: 'flex gap-2 items-center',
            onSelect: () => openItemEdit(item),
        },
        {
            label: 'Delete',
            icon: 'i-lucide-trash',
            color: 'error',
            class: 'flex gap-2 items-center',
            onSelect: () => openItemDelete(item),
        },
    ]
}

/*
|--------------------------------------------------------------------------
| Categories
|--------------------------------------------------------------------------
*/

const categoriesOpen = ref(false)
const newCategoryName = ref('')
const savingCategory = ref(false)
const categoryError = ref('')

const categoryEditingId = ref<number | null>(null)
const categoryEditingName = ref('')

const categoryDeleteOpen = ref(false)
const categoryToDelete = ref<Category | null>(null)
const deletingCategory = ref(false)
const categoryDeleteError = ref('')

const itemCountFor = (name: string) => {
    return inventoryItems.value.filter((item) => item.category === name).length
}

async function addCategory() {
    if (savingCategory.value) return

    categoryError.value = ''

    const name = newCategoryName.value.trim()
    if (!name) {
        categoryError.value = 'Category name is required.'
        return
    }

    savingCategory.value = true

    try {
        await strapi.post('/categories', { data: { name } })
        newCategoryName.value = ''
        await refreshCategories()
        toast.add({
            title: 'Category added',
            description: `${name} was added`,
        })
    } catch (err) {
        categoryError.value =
            (err as Error).message ??
            'Failed to add category. Please try again.'
    } finally {
        savingCategory.value = false
    }
}

async function createCategoryFromMenu(label: string) {
    if (creatingCategory.value) return

    const name = label.trim()
    if (!name) {
        return
    }

    creatingCategory.value = true
    itemFormError.value = ''

    try {
        const response = await strapi.post<{ data: Category }>('/categories', {
            data: { name },
        })
        await refreshCategories()
        itemForm.value.categoryId = response.data?.id ?? 0
        categoryMenuOpen.value = false
        toast.add({
            title: 'Category added',
            description: name + ' was added',
        })
    } catch (err) {
        itemFormError.value =
            (err as Error).message ??
            'Failed to add category. Please try again.'
    } finally {
        creatingCategory.value = false
    }
}

function startCategoryEdit(cat: Category) {
    categoryEditingId.value = cat.id
    categoryEditingName.value = cat.name
    categoryError.value = ''
}

function cancelCategoryEdit() {
    categoryEditingId.value = null
    categoryEditingName.value = ''
}

async function saveCategoryRename(cat: Category) {
    if (savingCategory.value) return

    categoryError.value = ''

    const name = categoryEditingName.value.trim()
    if (!name) {
        categoryError.value = 'Category name is required.'
        return
    }

    savingCategory.value = true

    try {
        await strapi.put(`/categories/${cat.documentId}`, {
            data: { name },
        })
        cancelCategoryEdit()
        await refreshCategories()
        await refresh()
        toast.add({
            title: 'Category renamed',
            description: `${cat.name} was renamed to ${name}`,
        })
    } catch (err) {
        categoryError.value =
            (err as Error).message ??
            'Failed to rename category. Please try again.'
    } finally {
        savingCategory.value = false
    }
}

function openCategoryDelete(cat: Category) {
    categoryToDelete.value = cat
    categoryDeleteError.value = ''
    categoryDeleteOpen.value = true
}

async function confirmCategoryDelete() {
    if (deletingCategory.value || !categoryToDelete.value) return

    deletingCategory.value = true
    categoryDeleteError.value = ''

    try {
        await strapi.delete(`/categories/${categoryToDelete.value.documentId}`)
        toast.add({
            title: 'Category deleted',
            description: `${categoryToDelete.value.name} was deleted`,
        })
        categoryDeleteOpen.value = false
        await refreshCategories()
        await refresh()
    } catch (err) {
        categoryDeleteError.value =
            (err as Error).message ??
            'Failed to delete category. Please try again.'
    } finally {
        deletingCategory.value = false
    }
}
</script>

<template>
    <div class="space-y-6">
        <!-- Page header -->
        <div
            class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div class="flex items-start gap-4">
                <div
                    class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-green-500 via-green-600 to-teal-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
                >
                    <UIcon name="i-lucide-store" class="size-7" />
                </div>

                <div>
                    <h1
                        class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
                    >
                        Point of Sale
                    </h1>

                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Sell items marked as available for sale.
                    </p>
                </div>
            </div>

            <div class="flex items-center justify-end gap-3">
                <UButton
                    icon="i-lucide-rotate-cw"
                    color="neutral"
                    variant="subtle"
                    size="lg"
                    :loading="pending || recentPending"
                    class="rounded-2xl px-2.5 sm:px-3"
                    @click="
                        (e) => {
                            e.preventDefault()
                            refreshAll()
                        }
                    "
                />
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

        <div v-else class="flex flex-col gap-6 xl:flex-row xl:items-start">
            <!-- Catalog -->
            <div class="min-w-0 flex-1">
                <div
                    class="flex flex-col gap-4 rounded-3xl border border-green-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-900"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-400"
                        >
                            <UIcon name="i-lucide-package" class="size-5" />
                        </div>

                        <div>
                            <h2
                                class="text-base font-semibold text-slate-900 dark:text-white"
                            >
                                Items For Sale
                            </h2>

                            <p
                                class="text-xs text-slate-500 dark:text-slate-400"
                            >
                                {{ itemsTotal }} item{{
                                    itemsTotal === 1 ? '' : 's'
                                }}
                                available
                            </p>
                        </div>
                    </div>

                    <UInput
                        v-model="search"
                        icon="i-lucide-search"
                        placeholder="Search name or SKU..."
                        size="lg"
                        class="w-full sm:w-64 sm:ml-auto"
                        :ui="{ base: 'rounded-lg' }"
                    />
                </div>

                <p
                    v-if="pending"
                    class="mt-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500"
                >
                    Loading items...
                </p>

                <p
                    v-else-if="filteredItems.length === 0"
                    class="mt-4 rounded-3xl border border-dashed border-green-200 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400"
                >
                    No items match your search.
                </p>

                <div
                    v-else
                    class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                    <div
                        v-for="item in filteredItems"
                        :key="item.id"
                        class="flex flex-col rounded-3xl border border-green-100 bg-white p-5 shadow-sm transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
                    >
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <p
                                    class="text-wrap text-sm font-semibold text-slate-900 dark:text-white"
                                >
                                    {{ item.name }}
                                </p>

                                <p
                                    class="mt-0.5 text-xs text-slate-500 dark:text-slate-400"
                                >
                                    {{ item.sku }}
                                </p>
                            </div>

                            <span
                                class="shrink-0 rounded-xl bg-green-500/10 px-2.5 py-1 text-sm font-bold tabular-nums text-green-700 dark:text-green-400"
                            >
                                {{ formatPrice(item.price) }}
                            </span>
                        </div>

                        <div class="mt-3 mb-4 flex items-center gap-2">
                            <span
                                class="text-xs"
                                :class="
                                    item.stockQty <= 0
                                        ? 'font-semibold text-red-600 dark:text-red-400'
                                        : 'text-slate-500 dark:text-slate-400'
                                "
                            >
                                {{ item.stockQty }} {{ item.unit }}
                                {{
                                    item.stockQty <= 0
                                        ? '· Out of stock'
                                        : 'in stock'
                                }}
                            </span>
                        </div>

                        <UButton
                            v-motion
                            block
                            :while-hover="{ scale: 1.01 }"
                            :while-press="{ scale: 0.99, y: 2 }"
                            class="mt-auto rounded-2xl"
                            color="success"
                            icon="i-lucide-shopping-cart"
                            :disabled="
                                item.stockQty <= 0 ||
                                cartQty(item.id) >= item.stockQty
                            "
                            variant="outline"
                            @click="addToCart(item)"
                        >
                            {{
                                item.stockQty <= 0
                                    ? 'Out of Stock'
                                    : cartQty(item.id) >= item.stockQty
                                      ? 'In Cart'
                                      : 'Add to Cart'
                            }}
                        </UButton>
                    </div>
                </div>

                <div
                    v-if="!pending && itemsTotal > 0"
                    class="mt-4 flex flex-col items-center gap-2"
                >
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                        Showing {{ saleItems.length }} of {{ itemsTotal }}
                    </p>

                    <UButton
                        v-if="hasMoreItems"
                        color="neutral"
                        variant="outline"
                        icon="i-lucide-chevrons-down"
                        :loading="loadingMore"
                        :disabled="loadingMore"
                        @click="loadMoreItems"
                    >
                        Load more items
                    </UButton>
                </div>
            </div>

            <aside class="w-full shrink-0 xl:sticky xl:top-6 xl:w-96 space-y-4">
                <!-- Recent transactions -->
                <RecentTransactions
                    :recent-pending="recentPending"
                    :recent-transactions="recentTransactions"
                />
            </aside>
        </div>

        <!-- Cart drawer (renders its own floating trigger) -->
        <CashierCart
            ref="cart"
            :sale-items="saleItems"
            @sale-completed="refreshAll"
        />
    </div>
</template>

<script setup lang="ts">
import type {
    CartExposed,
    SaleItem,
    ItemListResponse,
} from '#shared/types/cashier'
import type {
    RecentTransactionRow,
    RecentTransaction,
} from '#shared/types/transaction'

definePageMeta({
    layout: 'cashier',
})

const strapi = useStrapi()
const toast = useToast()
const search = ref('')

const ITEMS_PER_PAGE = 10

const {
    data: itemsResponse,
    error: fetchError,
    pending,
    refresh,
} = await useAsyncData('cashierSaleItems', () =>
    strapi.get<ItemListResponse>('/cashier/items', {
        'pagination[page]': 1,
        'pagination[pageSize]': ITEMS_PER_PAGE,
    })
)

const saleItems = ref<SaleItem[]>([])
const itemsPage = ref(1)
const itemsPageCount = ref(1)
const itemsTotal = ref(0)
const loadingMore = ref(false)

const hasMoreItems = computed(() => itemsPage.value < itemsPageCount.value)

function syncItems(response: ItemListResponse | null | undefined) {
    saleItems.value = response?.data ?? []

    const pagination = response?.meta?.pagination
    itemsPage.value = pagination?.page ?? 1
    itemsPageCount.value = pagination?.pageCount ?? 1
    itemsTotal.value = pagination?.total ?? saleItems.value.length
}

syncItems(itemsResponse.value)
watch(itemsResponse, syncItems)

async function loadMoreItems() {
    if (loadingMore.value || !hasMoreItems.value) {
        return
    }

    loadingMore.value = true

    try {
        const nextPage = itemsPage.value + 1
        const response = await strapi.get<ItemListResponse>('/cashier/items', {
            'pagination[page]': nextPage,
            'pagination[pageSize]': ITEMS_PER_PAGE,
        })

        const loadedIds = new Set(saleItems.value.map((item) => item.id))
        const newItems = (response.data ?? []).filter(
            (item) => !loadedIds.has(item.id)
        )

        saleItems.value = [...saleItems.value, ...newItems]

        const pagination = response.meta?.pagination
        itemsPage.value = pagination?.page ?? nextPage
        itemsPageCount.value = pagination?.pageCount ?? itemsPageCount.value
        itemsTotal.value = pagination?.total ?? itemsTotal.value
    } catch (error) {
        toast.add({
            title: 'Could not load more items',
            description: (error as Error).message || 'Please try again.',
            color: 'error',
        })
    } finally {
        loadingMore.value = false
    }
}

const errorMessage = computed(() => {
    const err = fetchError.value as {
        data?: { statusMessage?: string }
    } | null
    return err?.data?.statusMessage ?? 'Failed to load items'
})

const filteredItems = computed(() => {
    const query = search.value.trim().toLowerCase()
    if (!query) {
        return saleItems.value
    }

    return saleItems.value.filter(
        (item) =>
            item.name.toLowerCase().includes(query) ||
            item.sku.toLowerCase().includes(query)
    )
})

const formatPrice = (value: number | null | undefined): string => {
    if (value == null) {
        return '—'
    }

    return '₱' + value.toFixed(2)
}

function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(iso))
}

/*
|--------------------------------------------------------------------------
| Cart
|--------------------------------------------------------------------------
*/

const cart = useTemplateRef<CartExposed>('cart')

function cartQty(itemId: number): number {
    return cart.value?.cartQty(itemId) ?? 0
}

function addToCart(item: SaleItem) {
    cart.value?.addToCart(item)
}

/*
|--------------------------------------------------------------------------
| Recent transactions
|--------------------------------------------------------------------------
*/

const {
    data: recentTransactionsResponse,
    pending: recentPending,
    refresh: refreshRecentTransactions,
} = await useAsyncData('cashierRecentTransactions', () =>
    strapi.get<{ data: RecentTransaction[] }>('/transactions/cashier', {
        sort: 'createdAt:desc',
        pagination: { limit: 5 },
    })
)

// MAPPING TRANSACTIONS FOR DISPLAY
const recentTransactions = computed<RecentTransactionRow[]>(() =>
    (recentTransactionsResponse.value?.data ?? []).map((transaction) => ({
        ...transaction,
        date: formatDate(transaction.createdAt),
    }))
)

async function refreshAll() {
    await Promise.all([refresh(), refreshRecentTransactions()])
}
</script>

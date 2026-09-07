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
                    :loading="pending"
                    class="rounded-2xl px-2.5 sm:px-3"
                    @click="
                        (e) => {
                            e.preventDefault()
                            refresh()
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

        <div
            class="flex flex-col gap-6 xl:flex-row xl:items-start"
            v-else
        >
            <!-- Catalog -->
            <div class="min-w-0 flex-1">
                <div
                    class="flex flex-col gap-4 rounded-3xl border border-green-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-900"
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
                                {{ saleItems.length }} item{{
                                    saleItems.length === 1 ? '' : 's'
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
                                    class="truncate text-sm font-semibold text-slate-900 dark:text-white"
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

                        <div class="mt-3 flex items-center gap-2">
                            <span
                                class="text-xs"
                                :class="
                                    item.stockQty <= 0
                                        ? 'font-semibold text-red-600 dark:text-red-400'
                                        : 'text-slate-500 dark:text-slate-400'
                                "
                            >
                                {{ item.stockQty }} {{ item.unit }}
                                {{ item.stockQty <= 0 ? '· Out of stock' : 'in stock' }}
                            </span>
                        </div>

                        <UButton
                            block
                            class="mt-4 rounded-2xl"
                            color="success"
                            icon="i-lucide-shopping-cart"
                            :disabled="
                                item.stockQty <= 0 ||
                                cartQty(item.id) >= item.stockQty
                            "
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
            </div>

            <!-- Cart -->
            <aside class="w-full shrink-0 xl:sticky xl:top-6 xl:w-96">
                <div
                    class="flex flex-col overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                    <div
                        class="flex items-center justify-between border-b border-green-100 bg-green-50/60 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/60"
                    >
                        <p
                            class="text-sm font-semibold text-slate-800 dark:text-slate-200"
                        >
                            Cart · {{ cartLines.length }} item{{
                                cartLines.length === 1 ? '' : 's'
                            }}
                        </p>

                        <UButton
                            color="neutral"
                            variant="ghost"
                            size="xs"
                            icon="i-lucide-trash-2"
                            :disabled="!cartLines.length"
                            @click="clearCart"
                        >
                            Clear
                        </UButton>
                    </div>

                    <UAlert
                        v-if="checkoutError"
                        color="error"
                        variant="soft"
                        icon="i-lucide-alert-circle"
                        :title="checkoutError"
                        class="mx-5 mt-4"
                    />

                    <div class="px-5 py-4">
                        <p
                            v-if="cartLines.length === 0"
                            class="py-6 text-center text-sm text-slate-400 dark:text-slate-500"
                        >
                            No items in cart yet. Add items from the catalog.
                        </p>

                        <ul
                            v-else
                            class="max-h-80 divide-y divide-green-100 overflow-y-auto dark:divide-slate-700"
                        >
                            <li
                                v-for="line in cartLines"
                                :key="line.item.id"
                                class="flex items-center gap-3 py-3"
                            >
                                <div class="min-w-0 flex-1">
                                    <p
                                        class="truncate text-sm font-medium text-slate-800 dark:text-slate-200"
                                    >
                                        {{ line.item.name }}
                                    </p>

                                    <p
                                        class="text-xs text-slate-500 dark:text-slate-400"
                                    >
                                        {{ line.item.unit }} ·
                                        {{ formatPrice(line.item.price) }} each
                                    </p>
                                </div>

                                <UInputNumber
                                    v-model="cart[line.item.id]"
                                    :min="1"
                                    :max="line.item.stockQty"
                                    :step="1"
                                    class="w-20 shrink-0"
                                />

                                <span
                                    class="w-16 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200"
                                >
                                    {{ formatPrice(lineTotal(line)) }}
                                </span>

                                <UButton
                                    icon="i-lucide-x"
                                    color="error"
                                    variant="ghost"
                                    size="sm"
                                    @click="removeFromCart(line.item.id)"
                                />
                            </li>
                        </ul>
                    </div>

                    <div class="border-t border-green-100 px-5 py-4 dark:border-slate-700">
                        <UInput
                            v-model="notes"
                            icon="i-lucide-sticky-note"
                            placeholder="Notes (optional)..."
                        />
                    </div>

                    <div class="px-5 pb-5">
                        <div
                            class="flex items-center justify-between rounded-2xl border border-green-100 bg-green-50/60 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60"
                        >
                            <p
                                class="text-sm font-medium text-slate-600 dark:text-slate-300"
                            >
                                Total
                            </p>

                            <p
                                class="text-lg font-bold tabular-nums text-slate-900 dark:text-white"
                            >
                                {{ formatPrice(cartTotal) }}
                            </p>
                        </div>

                        <UButton
                            block
                            size="lg"
                            color="success"
                            icon="i-lucide-check"
                            class="mt-4 rounded-2xl"
                            :loading="submitting"
                            :disabled="!cartLines.length"
                            @click="submitSale"
                        >
                            Complete Sale
                        </UButton>
                    </div>
                </div>
            </aside>
        </div>

        <!-- Receipt modal -->
        <UModal
            v-model:open="receiptOpen"
            :ui="{ content: 'rounded-[28px] max-w-lg' }"
        >
            <template #content>
                <div
                    class="relative overflow-hidden rounded-[28px] border border-green-100 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90"
                >
                    <div class="flex items-start gap-4">
                        <div
                            class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-green-500 via-green-600 to-teal-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
                        >
                            <UIcon name="i-lucide-check" class="size-5" />
                        </div>

                        <div>
                            <h2
                                class="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                            >
                                Sale Completed
                            </h2>

                            <p
                                class="mt-0.5 text-sm text-slate-500 dark:text-slate-400"
                            >
                                Transaction #{{ receipt?.id }} · Total
                                {{ formatPrice(receipt?.total ?? 0) }}
                            </p>
                        </div>
                    </div>

                    <div
                        class="mt-5 divide-y divide-green-100 overflow-hidden rounded-2xl border border-green-100 dark:divide-slate-700 dark:border-slate-700"
                    >
                        <div
                            v-for="line in receipt?.lines ?? []"
                            :key="line.itemId"
                            class="flex items-center gap-3 px-4 py-3"
                        >
                            <span
                                class="w-8 shrink-0 text-center text-xs font-bold text-green-700 dark:text-green-400"
                            >
                                ×{{ line.qty }}
                            </span>

                            <p
                                class="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-200"
                            >
                                {{ line.name }}
                            </p>

                            <span
                                class="shrink-0 text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-300"
                            >
                                {{ formatPrice(line.lineTotal) }}
                            </span>
                        </div>
                    </div>

                    <div
                        v-if="receipt?.notes"
                        class="mt-4 rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300"
                    >
                        <span class="font-semibold">Notes:</span>
                        {{ receipt.notes }}
                    </div>

                    <div class="mt-6 flex justify-end gap-3">
                        <UButton
                            color="success"
                            icon="i-lucide-shopping-bag"
                            @click="receiptOpen = false"
                        >
                            New Sale
                        </UButton>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: 'cashier',
})

interface SaleItem {
    id: number
    name: string
    sku: string
    stockQty: number
    minThreshold: number
    unit: string
    price: number | null
}

interface ItemListResponse {
    data: SaleItem[]
}

interface SaleTransaction {
    id: number
    documentId: string
    orderStatus: 'Pending' | 'Completed' | 'Voided'
    notes?: string | null
}

interface ReceiptLine {
    itemId: number
    name: string
    qty: number
    lineTotal: number
}

interface Receipt {
    id: number
    total: number
    notes?: string
    lines: ReceiptLine[]
}

const strapi = useStrapi()
const toast = useToast()

const search = ref('')

const { data, error: fetchError, pending, refresh } = await useAsyncData(
    'cashierSaleItems',
    () => strapi.get<ItemListResponse>('/cashier/items')
)

const saleItems = computed<SaleItem[]>(() => data.value?.data ?? [])

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

/*
|--------------------------------------------------------------------------
| Cart
|--------------------------------------------------------------------------
*/

const cart = ref<Record<number, number>>({})
const notes = ref('')

const cartQty = (itemId: number): number => cart.value[itemId] ?? 0

const cartLines = computed(() =>
    saleItems.value
        .filter((item) => cartQty(item.id) > 0)
        .map((item) => ({
            item,
            qty: cartQty(item.id),
        }))
)

const lineTotal = (line: { item: SaleItem; qty: number }): number =>
    (line.item.price ?? 0) * line.qty

const cartTotal = computed(() =>
    cartLines.value.reduce((sum, line) => sum + lineTotal(line), 0)
)

function addToCart(item: SaleItem) {
    const current = cartQty(item.id)
    if (current >= item.stockQty) {
        return
    }

    cart.value = { ...cart.value, [item.id]: current + 1 }
    toast.add({
        title: 'Added to cart',
        description: `${item.name} (${formatPrice(item.price)})`,
    })
}

function removeFromCart(itemId: number) {
    const next = { ...cart.value }
    delete next[itemId]
    cart.value = next
}

function clearCart() {
    cart.value = {}
    notes.value = ''
}

/*
|--------------------------------------------------------------------------
| Checkout
|--------------------------------------------------------------------------
*/

const submitting = ref(false)
const checkoutError = ref('')
const receiptOpen = ref(false)
const receipt = ref<Receipt | null>(null)

async function submitSale() {
    if (submitting.value || !cartLines.value.length) {
        return
    }

    checkoutError.value = ''
    submitting.value = true

    try {
        const response = await strapi.post<{ data: SaleTransaction }>(
            '/cashier/issue',
            {
                items: cartLines.value.map((line) => ({
                    item: line.item.id,
                    qtyPulled: line.qty,
                })),
                notes: notes.value.trim() || undefined,
            }
        )

        const transactionId = response?.data?.id ?? 0

        receipt.value = {
            id: transactionId,
            total: cartTotal.value,
            notes: notes.value.trim() || undefined,
            lines: cartLines.value.map((line) => ({
                itemId: line.item.id,
                name: line.item.name,
                qty: line.qty,
                lineTotal: lineTotal(line),
            })),
        }

        toast.add({
            title: 'Sale completed',
            description: `Transaction #${transactionId} for ${formatPrice(cartTotal.value)}`,
            color: 'success',
        })

        clearCart()
        receiptOpen.value = true
        await refresh()
    } catch (err) {
        checkoutError.value =
            (err as Error).message ?? 'Failed to complete sale. Please try again.'
    } finally {
        submitting.value = false
    }
}
</script>

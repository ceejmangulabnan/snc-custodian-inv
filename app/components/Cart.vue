<template>
    <div
        class="flex flex-col overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
        <div
            class="flex items-center justify-between border-b border-green-100 bg-green-50/60 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/60"
        >
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">
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

                        <p class="text-xs text-slate-500 dark:text-slate-400">
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
                class="w-full"
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
                                class="min-w-0 flex-1 text-wrap text-sm font-medium text-slate-800 dark:text-slate-200"
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
import type {
    CartExposed,
    Receipt,
    SaleItem,
    SaleTransaction,
} from '#shared/types/cashier'

const props = defineProps<{ saleItems: SaleItem[] }>()

const emit = defineEmits<{
    'sale-completed': []
}>()

const strapi = useStrapi()
const toast = useToast()

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
    props.saleItems
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

defineExpose<CartExposed>({ cartQty, addToCart })

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
        const total = cartTotal.value
        const trimmedNotes = notes.value.trim() || undefined

        receipt.value = {
            id: transactionId,
            total,
            notes: trimmedNotes,
            lines: cartLines.value.map((line) => ({
                itemId: line.item.id,
                name: line.item.name,
                qty: line.qty,
                lineTotal: lineTotal(line),
            })),
        }

        toast.add({
            title: 'Sale completed',
            description: `Transaction #${transactionId} for ${formatPrice(total)}`,
            color: 'success',
        })

        clearCart()
        receiptOpen.value = true
        emit('sale-completed')
    } catch (err) {
        checkoutError.value =
            (err as Error).message ??
            'Failed to complete sale. Please try again.'
    } finally {
        submitting.value = false
    }
}
</script>

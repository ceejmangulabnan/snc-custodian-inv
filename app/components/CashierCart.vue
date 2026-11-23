<template>
    <USlideover
        v-model:open="cartOpen"
        side="right"
        :title="cartTitle"
        :overlay="!checkoutOpen && !receiptOpen"
        :ui="{
            content: 'rounded-l-3xl',
            footer: 'flex-col items-stretch gap-3 p-4 sm:px-6',
        }"
    >
        <!-- Floating trigger -->
        <div class="fixed right-6 bottom-6 z-40">
            <UButton
                v-motion
                :while-hover="{ scale: 1.05 }"
                :while-press="{ scale: 0.95, y: 2 }"
                icon="i-lucide-shopping-cart"
                size="lg"
                color="success"
                class="size-14 justify-center rounded-full p-0 shadow-[0_10px_30px_rgba(16,185,129,0.45)]"
                :aria-label="`Open cart (${cartLines.length} items)`"
            />

            <UBadge
                v-if="cartLines.length"
                :key="cartLines.length"
                v-motion
                :initial="{ scale: 0.5, opacity: 0 }"
                :animate="{ scale: 1, opacity: 1 }"
                color="error"
                size="sm"
                class="pointer-events-none absolute -top-1 -right-1 min-w-5 justify-center rounded-full"
            >
                {{ cartLines.length }}
            </UBadge>
        </div>

        <template #actions>
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
        </template>

        <template #body>
            <p
                v-if="cartLines.length === 0"
                class="py-6 text-center text-sm text-slate-400 dark:text-slate-500"
            >
                No items in cart yet. Add items from the catalog.
            </p>

            <ul v-else class="divide-y divide-green-100 dark:divide-slate-700">
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
                            {{ formatPrice(line.item.price) }} ·
                            {{ line.item.unit }}
                        </p>
                    </div>

                    <UInputNumber
                        v-model="cart[line.item.id]"
                        :min="1"
                        :max="line.item.stockQty"
                        :step="1"
                        class="w-28 shrink-0"
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
        </template>

        <template #footer>
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

            <CheckoutModal
                v-model:open="checkoutOpen"
                v-model:notes="notes"
                :cart-lines="cartLines"
                :cart-total="cartTotal"
                @completed="onSaleCompleted"
            />

            <ReceiptModal v-model:open="receiptOpen" :receipt="receipt" />
        </template>
    </USlideover>
</template>

<script setup lang="ts">
import type { CartExposed, Receipt, SaleItem } from '#shared/types/cashier'

const props = defineProps<{ saleItems: SaleItem[] }>()

const emit = defineEmits<{
    'sale-completed': []
}>()

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

const cartOpen = ref(false)
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

const cartTitle = computed(() => {
    const count = cartLines.value.length
    return `Cart · ${count} item${count === 1 ? '' : 's'}`
})

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
}

function removeFromCart(itemId: number) {
    cart.value = { ...cart.value, [itemId]: 0 }
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

const checkoutOpen = ref(false)
const receiptOpen = ref(false)
const receipt = ref<Receipt | null>(null)

async function onSaleCompleted(result: Receipt) {
    checkoutOpen.value = false
    receipt.value = result
    clearCart()

    toast.add({
        title: 'Sale completed',
        description: `Transaction #${result.id} for ${formatPrice(result.total)}`,
        color: 'success',
    })

    emit('sale-completed')

    // Let the checkout modal finish closing before opening the receipt.
    await nextTick()
    receiptOpen.value = true
}
</script>

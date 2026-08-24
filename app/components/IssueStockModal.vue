<template>
    <UModal
        :open="open"
        :ui="{ content: 'rounded-[28px] max-w-4xl' }"
        @update:open="$emit('update:open', $event)"
    >
        <template #content>
            <div
                class="relative flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-green-100 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90"
            >
                <div class="flex items-start gap-4">
                    <div
                        class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-green-500 via-emerald-600 to-teal-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
                    >
                        <UIcon
                            name="i-lucide-shopping-cart"
                            class="size-5"
                        />
                    </div>

                    <div>
                        <h2
                            class="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                        >
                            Issue Stock
                        </h2>

                        <p
                            class="mt-0.5 text-sm text-slate-500 dark:text-slate-400"
                        >
                            Add items and issue them now. Stock is deducted on
                            submission.
                        </p>
                    </div>
                </div>

                <div
                    class="mt-5 flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-0"
                >
                    <!-- Left column: search + catalog -->
                    <div
                        class="flex min-h-0 min-w-0 flex-1 flex-col lg:min-h-0"
                    >
                        <UInput
                            v-model="issueSearch"
                            icon="i-lucide-search"
                            placeholder="Search items..."
                        />

                        <div
                            class="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1"
                        >
                            <p
                                v-if="loadingCatalog"
                                class="py-8 text-center text-sm text-slate-400 dark:text-slate-500"
                            >
                                Loading items...
                            </p>

                            <p
                                v-else-if="filteredIssueCatalog.length === 0"
                                class="py-8 text-center text-sm text-slate-400 dark:text-slate-500"
                            >
                                No items match your search.
                            </p>

                            <div
                                v-for="item in filteredIssueCatalog"
                                :key="item.id"
                                class="flex items-center gap-3 rounded-2xl border border-green-100 px-4 py-3 dark:border-slate-700"
                            >
                                <div class="min-w-0 flex-1">
                                    <p
                                        class="truncate text-sm font-medium text-slate-800 dark:text-slate-200"
                                    >
                                        {{ item.name }}
                                    </p>

                                    <p
                                        class="text-xs text-slate-500 dark:text-slate-400"
                                    >
                                        {{ item.sku }}
                                    </p>
                                </div>

                                <span
                                    class="shrink-0 text-xs"
                                    :class="
                                        item.stockQty <= 0
                                            ? 'font-medium text-red-600 dark:text-red-400'
                                            : 'text-slate-500 dark:text-slate-400'
                                    "
                                >
                                    {{ item.stockQty }}
                                    {{ item.unit }} available
                                </span>

                                <UButton
                                    icon="i-lucide-plus"
                                    color="success"
                                    variant="soft"
                                    size="sm"
                                    :disabled="
                                        item.stockQty <= 0 ||
                                        cartQty(item.id) >= item.stockQty
                                    "
                                    @click="addToCart(item)"
                                >
                                    Add
                                </UButton>
                            </div>
                        </div>
                    </div>

                    <!-- Divider -->
                    <div
                        class="hidden w-px bg-green-100 dark:bg-slate-700 lg:block"
                    />

                    <!-- Right column: cart + notes -->
                    <div
                        class="flex shrink-0 flex-col gap-4 border-t border-green-100 pt-4 lg:min-h-0 lg:w-[28rem] lg:flex-1 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 dark:border-slate-700"
                    >
                        <div
                            v-if="cartLines.length"
                            class="overflow-hidden rounded-2xl border border-green-100 dark:border-slate-700"
                        >
                            <div
                                class="flex items-center justify-between border-b border-green-100 bg-green-50/60 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800/60"
                            >
                                <p
                                    class="text-xs font-semibold text-slate-700 dark:text-slate-200"
                                >
                                    Cart · {{ cartLines.length }} item{{
                                        cartLines.length === 1 ? '' : 's'
                                    }}
                                    · {{ cartTotalQty }} unit{{
                                        cartTotalQty === 1 ? '' : 's'
                                    }}
                                </p>

                                <UButton
                                    color="neutral"
                                    variant="ghost"
                                    size="xs"
                                    icon="i-lucide-trash-2"
                                    @click="clearCart"
                                >
                                    Clear
                                </UButton>
                            </div>

                            <ul
                                class="max-h-60 overflow-y-auto divide-y divide-green-100 dark:divide-slate-700"
                            >
                                <li
                                    v-for="line in cartLines"
                                    :key="line.itemId"
                                    class="flex items-center gap-3 px-4 py-2.5"
                                >
                                    <div class="min-w-0 flex-1">
                                        <p
                                            class="truncate text-sm font-medium text-slate-800 dark:text-slate-200"
                                        >
                                            {{ line.name }}
                                        </p>

                                        <p
                                            class="text-xs text-slate-500 dark:text-slate-400"
                                        >
                                            {{ line.unit }} · up to
                                            {{ line.stockQty }}
                                        </p>
                                    </div>

                                    <UInputNumber
                                        v-model="issueCart[line.itemId]"
                                        :min="1"
                                        :max="line.stockQty"
                                        :step="1"
                                        class="w-24 shrink-0"
                                    />

                                    <UButton
                                        icon="i-lucide-x"
                                        color="error"
                                        variant="ghost"
                                        size="sm"
                                        @click="removeFromCart(line.itemId)"
                                    />
                                </li>
                            </ul>
                        </div>

                        <div v-else class="py-6 text-center">
                            <p
                                class="text-sm text-slate-400 dark:text-slate-500"
                            >
                                No items in cart yet.
                            </p>
                        </div>

                        <div class="w-full">
                            <label
                                class="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300"
                            >
                                Notes (optional)
                            </label>

                            <UTextarea
                                class="w-full"
                                v-model="issueNotes"
                                placeholder="Who is this for, or what is it for?"
                                :rows="2"
                            />
                        </div>

                        <div
                            v-if="cartLines.length > 0"
                            class="flex justify-center"
                        >
                            <UButton
                                color="neutral"
                                variant="ghost"
                                size="sm"
                                icon="i-lucide-trash-2"
                                @click="clearCart"
                            >
                                Clear Order
                            </UButton>
                        </div>

                        <UAlert
                            v-if="issueError"
                            color="error"
                            variant="soft"
                            icon="i-lucide-alert-circle"
                            :title="issueError"
                        />
                    </div>
                </div>

                <div class="mt-6 flex shrink-0 justify-end gap-3">
                    <UButton
                        color="neutral"
                        variant="outline"
                        @click="$emit('update:open', false)"
                    >
                        Cancel
                    </UButton>

                    <UButton
                        color="warning"
                        icon="i-lucide-send"
                        :loading="requesting"
                        :disabled="cartLines.length === 0"
                        @click="submitRequest"
                    >
                        Request Approval
                    </UButton>

                    <UButton
                        color="success"
                        icon="i-lucide-shopping-cart"
                        :loading="issuing"
                        :disabled="cartLines.length === 0"
                        @click="submitIssue"
                    >
                        Issue Stock
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
interface RequestableItem {
    id: number
    name: string
    sku: string
    stockQty: number
    unit: string
}

const props = defineProps<{
    open: boolean
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    submitted: []
}>()

const strapi = useStrapi()
const toast = useToast()

const issuing = ref(false)
const requesting = ref(false)
const issueError = ref('')
const issueNotes = ref('')
const issueSearch = ref('')
const loadingCatalog = ref(false)
const issueCatalog = ref<RequestableItem[]>([])
const issueCart = ref<Record<number, number>>({})
const issueCartOrder = ref<number[]>([])

/*
|--------------------------------------------------------------------------
| localStorage draft
|--------------------------------------------------------------------------
*/

const DRAFT_KEY = 'snc_issue_stock_draft'
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000

function saveDraft() {
    const data = {
        cart: issueCart.value,
        cartOrder: issueCartOrder.value,
        notes: issueNotes.value,
        savedAt: Date.now(),
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
}

function loadDraft(): boolean {
    try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (!raw) return false
        const data = JSON.parse(raw) as {
            cart: Record<number, number>
            cartOrder: number[]
            notes: string
            savedAt: number
        }
        if (Date.now() - data.savedAt > DRAFT_TTL_MS) {
            localStorage.removeItem(DRAFT_KEY)
            return false
        }
        if (Object.keys(data.cart).length === 0) return false
        issueCart.value = data.cart
        issueCartOrder.value = data.cartOrder
        issueNotes.value = data.notes ?? ''
        return true
    } catch {
        localStorage.removeItem(DRAFT_KEY)
        return false
    }
}

function clearDraft() {
    localStorage.removeItem(DRAFT_KEY)
}

watch(
    [issueCart, issueCartOrder, issueNotes],
    () => {
        if (!props.open) return
        if (issueCartOrder.value.length === 0) {
            clearDraft()
            return
        }
        saveDraft()
    },
    { deep: true }
)

/*
|--------------------------------------------------------------------------
| Catalog
|--------------------------------------------------------------------------
*/

async function loadIssueCatalog() {
    loadingCatalog.value = true
    issueError.value = ''
    try {
        const response = await strapi.get<{ data: RequestableItem[] }>(
            '/items',
            {
                sort: 'name:asc',
                'pagination[pageSize]': 100,
                populate: 'category',
            }
        )
        issueCatalog.value = response.data
    } catch (err) {
        issueError.value =
            (err as Error).message ?? 'Failed to load items. Please try again.'
    } finally {
        loadingCatalog.value = false
    }
}

watch(
    () => props.open,
    (isOpen) => {
        if (!isOpen) return
        issueError.value = ''
        issueSearch.value = ''

        const restored = loadDraft()
        if (!restored) {
            issueNotes.value = ''
            issueCart.value = {}
            issueCartOrder.value = []
        }

        if (issueCatalog.value.length === 0) {
            loadIssueCatalog()
        }
    }
)

const filteredIssueCatalog = computed(() => {
    const query = issueSearch.value.trim().toLowerCase()
    if (!query) return issueCatalog.value
    return issueCatalog.value.filter(
        (item) =>
            item.name.toLowerCase().includes(query) ||
            item.sku.toLowerCase().includes(query)
    )
})

/*
|--------------------------------------------------------------------------
| Cart
|--------------------------------------------------------------------------
*/

function cartQty(itemId: number): number {
    return issueCart.value[itemId] ?? 0
}

function addToCart(item: RequestableItem) {
    const current = cartQty(item.id)
    if (current >= item.stockQty) return

    issueCart.value = {
        ...issueCart.value,
        [item.id]: current + 1,
    }
    if (current === 0) {
        issueCartOrder.value = [...issueCartOrder.value, item.id]
    }
}

function removeFromCart(itemId: number) {
    const next = { ...issueCart.value }
    delete next[itemId]
    issueCart.value = next
    issueCartOrder.value = issueCartOrder.value.filter((id) => id !== itemId)
}

function clearCart() {
    issueCart.value = {}
    issueCartOrder.value = []
    issueNotes.value = ''
    clearDraft()
}

const cartLines = computed(() => {
    const byId = new Map(issueCatalog.value.map((item) => [item.id, item]))

    return issueCartOrder.value
        .map((itemId) => byId.get(itemId))
        .filter((item): item is RequestableItem => item !== undefined)
        .map((item) => ({
            itemId: item.id,
            name: item.name,
            unit: item.unit,
            stockQty: item.stockQty,
            qty: Math.min(cartQty(item.id), item.stockQty),
        }))
        .filter((line) => line.qty > 0)
})

const cartTotalQty = computed(() =>
    cartLines.value.reduce((sum, line) => sum + line.qty, 0)
)

/*
|--------------------------------------------------------------------------
| Submit
|--------------------------------------------------------------------------
*/

async function submitIssue() {
    if (issuing.value) return

    const lines = cartLines.value
    if (lines.length === 0) {
        issueError.value = 'Add at least one item to the cart.'
        return
    }

    for (const line of lines) {
        if (line.qty < 1 || line.qty > line.stockQty) {
            issueError.value = `Quantity for "${line.name}" must be between 1 and ${line.stockQty}.`
            return
        }
    }

    issuing.value = true
    issueError.value = ''

    try {
        await strapi.post('/transactions/issue', {
            items: lines.map((line) => ({
                item: line.itemId,
                qtyPulled: line.qty,
            })),
            notes: issueNotes.value.trim() || undefined,
        })
        emit('update:open', false)
        clearDraft()
        toast.add({
            title: 'Stock issued',
            description: `${cartTotalQty.value} unit(s) issued across ${lines.length} item(s).`,
        })
        emit('submitted')
    } catch (err) {
        issueError.value =
            (err as Error).message ?? 'Failed to issue stock. Please try again.'
    } finally {
        issuing.value = false
    }
}

async function submitRequest() {
    if (requesting.value) return

    const lines = cartLines.value
    if (lines.length === 0) {
        issueError.value = 'Add at least one item to the cart.'
        return
    }

    for (const line of lines) {
        if (line.qty < 1 || line.qty > line.stockQty) {
            issueError.value = `Quantity for "${line.name}" must be between 1 and ${line.stockQty}.`
            return
        }
    }

    requesting.value = true
    issueError.value = ''

    try {
        await strapi.post('/transactions/request', {
            items: lines.map((line) => ({
                item: line.itemId,
                qtyPulled: line.qty,
            })),
            notes: issueNotes.value.trim() || undefined,
        })
        emit('update:open', false)
        clearDraft()
        toast.add({
            title: 'Request submitted',
            description: `Order for ${cartTotalQty.value} unit(s) across ${lines.length} item(s) submitted for approval.`,
        })
        emit('submitted')
    } catch (err) {
        issueError.value =
            (err as Error).message ??
            'Failed to submit request. Please try again.'
    } finally {
        requesting.value = false
    }
}
</script>

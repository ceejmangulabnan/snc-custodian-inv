<template>
    <UModal
        :open="open"
        :ui="{ content: 'rounded-[28px] max-w-lg' }"
        @update:open="$emit('update:open', $event)"
    >
        <template #content>
            <div
                class="flex max-h-[85vh] min-h-0 flex-col overflow-hidden rounded-[28px] border border-green-100 bg-white/90 py-6 px-4 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90"
            >
                <div class="flex items-start gap-4">
                    <div
                        class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-[0_10px_30px_rgba(245,158,11,0.35)]"
                    >
                        <UIcon
                            name="i-lucide-arrow-left-right"
                            class="size-5"
                        />
                    </div>

                    <div>
                        <h2
                            class="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                        >
                            Stock Movement
                        </h2>

                        <p
                            class="mt-0.5 text-sm text-slate-500 dark:text-slate-400"
                        >
                            Adjust inventory for
                            <span
                                class="font-medium text-slate-700 dark:text-slate-300"
                            >
                                {{ item?.name }}
                            </span>
                        </p>
                    </div>
                </div>

                <!-- Scrollable body: item summary + form fields -->
                <div
                    class="mt-5 flex min-h-0 flex-1 flex-col overflow-y-auto px-2"
                >
                    <!-- Item summary -->
                    <div
                        v-if="item"
                        class="flex items-center gap-4 rounded-2xl border border-green-100 bg-green-50/60 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60"
                    >
                        <div
                            class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        >
                            <UIcon name="i-lucide-package" class="size-4" />
                        </div>

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
                            class="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-200"
                        >
                            {{ item.stockQty }} {{ item.unit }}
                        </span>
                    </div>

                    <!-- Operation type -->
                    <div class="mt-5">
                        <label
                            class="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-300"
                        >
                            Operation
                        </label>

                        <div class="grid grid-cols-3 gap-2">
                            <button
                                v-for="op in operationOptions"
                                :key="op.value"
                                class="flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-xs font-medium transition-all"
                                :class="
                                    operation === op.value
                                        ? `${op.activeBorder} ${op.activeBg} ${op.activeText}`
                                        : 'border-green-100 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                "
                                @click="operation = op.value"
                            >
                                <UIcon :name="op.icon" class="size-5" />
                                {{ op.label }}
                            </button>
                        </div>
                    </div>

                    <!-- Quantity -->
                    <div class="mt-5 w-full">
                        <label
                            class="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-300"
                        >
                            {{ quantityLabel }}
                        </label>

                        <UInput
                            v-model.number="quantity"
                            type="number"
                            :min="quantityMin"
                            :max="quantityMax"
                            :placeholder="quantityPlaceholder"
                            size="lg"
                            class="w-full"
                        />

                        <p
                            v-if="item && quantity > 0"
                            class="mt-2 text-xs text-slate-500 dark:text-slate-400"
                        >
                            Stock will change from
                            <span
                                class="font-medium text-slate-700 dark:text-slate-300"
                            >
                                {{ item.stockQty }} {{ item.unit }}
                            </span>
                            →
                            <span
                                class="font-semibold"
                                :class="
                                    computedNewStock < 0
                                        ? 'text-red-600 dark:text-red-400'
                                        : computedNewStock <= item.minThreshold
                                          ? 'text-amber-600 dark:text-amber-400'
                                          : 'text-green-600 dark:text-green-400'
                                "
                            >
                                {{ computedNewStock }} {{ item.unit }}
                            </span>
                        </p>
                    </div>

                    <!-- Reason -->
                    <div class="mt-5">
                        <label
                            class="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300"
                        >
                            Reason (optional)
                        </label>

                        <UInput
                            v-model="reason"
                            placeholder="e.g. Delivery received, Damaged goods, Cycle count"
                            class="w-full"
                        />
                    </div>

                    <!-- Notes -->
                    <div class="mt-4">
                        <label
                            class="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300"
                        >
                            Notes (optional)
                        </label>

                        <UTextarea
                            v-model="notes"
                            placeholder="Any additional context..."
                            :rows="2"
                            :maxrows="4"
                            class="w-full"
                        />
                    </div>

                    <UAlert
                        v-if="error"
                        color="error"
                        variant="soft"
                        icon="i-lucide-alert-circle"
                        :title="error"
                        class="mt-4"
                    />
                </div>

                <!-- Footer -->
                <div
                    class="mt-5 flex shrink-0 justify-end gap-3 border-t border-green-100 pt-4 dark:border-slate-700"
                >
                    <UButton
                        color="neutral"
                        variant="outline"
                        @click="$emit('update:open', false)"
                    >
                        Cancel
                    </UButton>

                    <UButton
                        :color="submitColor"
                        :icon="submitIcon"
                        :loading="submitting"
                        :disabled="!canSubmit"
                        @click="submit"
                    >
                        {{ submitLabel }}
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
interface MovementItem {
    id: number
    name: string
    sku: string
    stockQty: number
    minThreshold: number
    unit: string
}

const props = defineProps<{
    open: boolean
    item: MovementItem | null
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    submitted: []
}>()

const strapi = useStrapi()
const toast = useToast()

const operation = ref<'in' | 'out' | 'adjust'>('in')
const quantity = ref<number>(0)
const reason = ref('')
const notes = ref('')
const error = ref('')
const submitting = ref(false)

watch(
    () => props.open,
    (isOpen) => {
        if (!isOpen) return
        operation.value = 'in'
        quantity.value = 0
        reason.value = ''
        notes.value = ''
        error.value = ''
    }
)

/*
|--------------------------------------------------------------------------
| Operation options
|--------------------------------------------------------------------------
*/

const operationOptions = computed(() => [
    {
        value: 'in' as const,
        label: 'Stock In',
        icon: 'i-lucide-arrow-down-left',
        activeBorder: 'border-green-500',
        activeBg: 'bg-green-50 dark:bg-green-900/30',
        activeText: 'text-green-700 dark:text-green-300',
    },
    {
        value: 'out' as const,
        label: 'Stock Out',
        icon: 'i-lucide-arrow-up-right',
        activeBorder: 'border-red-500',
        activeBg: 'bg-red-50 dark:bg-red-900/30',
        activeText: 'text-red-700 dark:text-red-300',
    },
    {
        value: 'adjust' as const,
        label: 'Adjustment',
        icon: 'i-lucide-sliders',
        activeBorder: 'border-amber-500',
        activeBg: 'bg-amber-50 dark:bg-amber-900/30',
        activeText: 'text-amber-700 dark:text-amber-300',
    },
])

/*
|--------------------------------------------------------------------------
| Quantity helpers
|--------------------------------------------------------------------------
*/

const quantityLabel = computed(() => {
    if (operation.value === 'adjust') return 'Target quantity'
    return 'Quantity'
})

const quantityMin = computed(() => (operation.value === 'adjust' ? 0 : 1))

const quantityMax = computed(() =>
    operation.value === 'out' ? props.item?.stockQty : undefined
)

const quantityPlaceholder = computed(() => {
    if (operation.value === 'adjust')
        return `Current: ${props.item?.stockQty ?? 0}`
    if (operation.value === 'out') return `Max: ${props.item?.stockQty ?? 0}`
    return '0'
})

const computedNewStock = computed(() => {
    if (!props.item) return 0
    if (operation.value === 'in') return props.item.stockQty + quantity.value
    if (operation.value === 'out') return props.item.stockQty - quantity.value
    return quantity.value
})

/*
|--------------------------------------------------------------------------
| Submit
|--------------------------------------------------------------------------
*/

const canSubmit = computed(() => {
    if (submitting.value) return false
    if (!props.item) return false
    const q = quantity.value
    if (!Number.isInteger(q)) return false
    if (operation.value === 'adjust') return q >= 0
    return q >= 1
})

const submitLabel = computed(() => {
    if (operation.value === 'in') return 'Receive Stock'
    if (operation.value === 'out') return 'Disburse Stock'
    return 'Apply Adjustment'
})

const submitColor = computed(() => {
    if (operation.value === 'in') return 'success' as const
    if (operation.value === 'out') return 'error' as const
    return 'warning' as const
})

const submitIcon = computed(() => {
    if (operation.value === 'in') return 'i-lucide-arrow-down-left'
    if (operation.value === 'out') return 'i-lucide-arrow-up-right'
    return 'i-lucide-sliders'
})

async function submit() {
    if (!canSubmit.value || !props.item) return

    submitting.value = true
    error.value = ''

    try {
        const payload: Record<string, unknown> = {
            item: props.item.id,
            reason: reason.value.trim() || undefined,
            notes: notes.value.trim() || undefined,
        }

        if (operation.value === 'adjust') {
            payload.newQty = quantity.value
        } else {
            payload.qty = quantity.value
        }

        const path =
            operation.value === 'in'
                ? '/stock-movements/in'
                : operation.value === 'out'
                  ? '/stock-movements/out'
                  : '/stock-movements/adjust'

        const response = await strapi.post<{
            data: { item: number; previousStock: number; newStock: number }
        }>(path, payload)

        const { previousStock, newStock } = response.data

        toast.add({
            title:
                operation.value === 'in'
                    ? 'Stock received'
                    : operation.value === 'out'
                      ? 'Stock disbursed'
                      : 'Stock adjusted',
            description: `${props.item.name}: ${previousStock} → ${newStock} ${props.item.unit}`,
        })

        emit('update:open', false)
        emit('submitted')
    } catch (err) {
        error.value =
            (err as Error).message ?? 'Failed to process stock movement.'
    } finally {
        submitting.value = false
    }
}
</script>

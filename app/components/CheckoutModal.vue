<template>
    <UModal
        v-model:open="open"
        :ui="{
            content:
                'rounded-[28px] max-w-5xl max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden',
        }"
    >
        <UButton
            block
            size="lg"
            color="success"
            icon="i-lucide-check"
            class="mt-4 rounded-2xl"
            :disabled="!cartLines.length"
        >
            Checkout
        </UButton>

        <template #content>
            <div
                class="relative flex min-h-0 flex-1 flex-col rounded-[28px] border border-green-100 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90"
            >
                <div class="flex items-start gap-4">
                    <div
                        class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-green-500 via-emerald-600 to-teal-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
                    >
                        <UIcon name="i-lucide-shopping-cart" class="size-5" />
                    </div>

                    <div>
                        <h2
                            class="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                        >
                            Complete Sale
                        </h2>

                        <p
                            class="mt-0.5 text-sm text-slate-500 dark:text-slate-400"
                        >
                            Review the order and record the student's details.
                            Stock is deducted on submission.
                        </p>
                    </div>
                </div>

                <div class="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
                    <div class="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                        <!-- Left column: sale details -->
                        <div class="space-y-3">
                            <p
                                class="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
                            >
                                Sale Details
                            </p>

                            <UFormField
                                label="Receipt Number"
                                required
                                :error="fieldErrors.receiptNumber"
                            >
                                <UInput
                                    v-model="receiptNumber"
                                    class="w-full"
                                    icon="i-lucide-receipt-text"
                                    placeholder="e.g. OR-000123"
                                    autocomplete="off"
                                />
                            </UFormField>

                            <UFormField
                                label="Student ID Number"
                                required
                                :error="fieldErrors.studentIdNumber"
                            >
                                <UInput
                                    v-model="studentIdNumber"
                                    class="w-full"
                                    icon="i-lucide-id-card"
                                    placeholder="e.g. 26-000123"
                                    autocomplete="off"
                                />
                            </UFormField>

                            <UFormField
                                label="Student Name"
                                required
                                :error="fieldErrors.studentName"
                            >
                                <UInput
                                    v-model="studentName"
                                    class="w-full"
                                    icon="i-lucide-user"
                                    placeholder="Full name"
                                    autocomplete="off"
                                />
                            </UFormField>

                            <UFormField
                                label="Purchase Date"
                                required
                                :error="fieldErrors.purchaseDate"
                            >
                                <UInput
                                    v-model="purchaseDate"
                                    type="date"
                                    class="w-full"
                                />
                            </UFormField>

                            <UFormField label="Notes (optional)">
                                <UTextarea
                                    v-model="notes"
                                    class="w-full"
                                    placeholder="Who is this for, or what is it for?"
                                    :rows="2"
                                    :maxrows="4"
                                />
                            </UFormField>
                        </div>

                        <!-- Right column: order summary -->
                        <div class="flex min-h-0 flex-col gap-3">
                            <p
                                class="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
                            >
                                Order Summary
                            </p>

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
                                </div>

                                <ul
                                    class="max-h-64 divide-y divide-green-100 overflow-y-auto dark:divide-slate-700"
                                >
                                    <li
                                        v-for="line in cartLines"
                                        :key="line.item.id"
                                        class="flex items-center gap-3 px-4 py-2.5"
                                    >
                                        <div class="min-w-0 flex-1">
                                            <p
                                                class="text-wrap text-sm font-medium text-slate-800 dark:text-slate-200"
                                            >
                                                {{ line.item.name }}
                                            </p>

                                            <p
                                                class="text-xs text-slate-500 dark:text-slate-400"
                                            >
                                                {{ line.qty }}
                                                {{ line.item.unit }} ×
                                                {{
                                                    formatPrice(line.item.price)
                                                }}
                                            </p>
                                        </div>

                                        <span
                                            class="shrink-0 text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-300"
                                        >
                                            {{ formatPrice(lineTotal(line)) }}
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <div
                                v-else
                                class="rounded-xl border-2 border-dashed border-slate-200 py-6 text-center dark:border-slate-700"
                            >
                                <p
                                    class="text-sm text-slate-400 dark:text-slate-500"
                                >
                                    No items in cart yet.
                                </p>
                            </div>

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
                        </div>
                    </div>
                </div>

                <UAlert
                    v-if="checkoutError"
                    color="error"
                    variant="soft"
                    icon="i-lucide-alert-circle"
                    :title="checkoutError"
                    class="mt-4 shrink-0"
                />

                <div
                    class="mt-4 flex shrink-0 justify-end gap-3 border-t border-green-100 pt-4 dark:border-slate-700"
                >
                    <UButton
                        color="neutral"
                        variant="outline"
                        :disabled="submitting"
                        @click="open = false"
                    >
                        Cancel
                    </UButton>

                    <UButton
                        color="success"
                        icon="i-lucide-check"
                        :loading="submitting"
                        :disabled="cartLines.length === 0"
                        @click="submitSale"
                    >
                        Complete Sale
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>

<script lang="ts" setup>
import type { Receipt, SaleItem, SaleTransaction } from '#shared/types/cashier'

const props = defineProps<{
    cartLines: { item: SaleItem; qty: number }[]
    cartTotal: number
}>()

const emit = defineEmits<{
    completed: [receipt: Receipt]
}>()

const open = defineModel<boolean>('open', { default: false })
const notes = defineModel<string>('notes', { default: '' })

const strapi = useStrapi()

const receiptNumber = ref('')
const studentIdNumber = ref('')
const studentName = ref('')
const purchaseDate = ref(todayIso())

const submitting = ref(false)
const checkoutError = ref('')
const fieldErrors = reactive({
    receiptNumber: undefined as string | undefined,
    studentIdNumber: undefined as string | undefined,
    studentName: undefined as string | undefined,
    purchaseDate: undefined as string | undefined,
})

function clearFieldErrors() {
    fieldErrors.receiptNumber = undefined
    fieldErrors.studentIdNumber = undefined
    fieldErrors.studentName = undefined
    fieldErrors.purchaseDate = undefined
}

const formatPrice = (value: number | null | undefined): string => {
    if (value == null) {
        return '—'
    }

    return '₱' + value.toFixed(2)
}

const lineTotal = (line: { item: SaleItem; qty: number }): number =>
    (line.item.price ?? 0) * line.qty

const cartTotalQty = computed(() =>
    props.cartLines.reduce((sum, line) => sum + line.qty, 0)
)

function todayIso(): string {
    const now = new Date()
    const offset = now.getTimezoneOffset() * 60 * 1000
    return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function resetForm() {
    receiptNumber.value = ''
    studentIdNumber.value = ''
    studentName.value = ''
    purchaseDate.value = todayIso()
    clearFieldErrors()
}

watch(open, (isOpen) => {
    if (isOpen) {
        checkoutError.value = ''
        clearFieldErrors()
        if (!purchaseDate.value) {
            purchaseDate.value = todayIso()
        }
    }
})

function syncCheckoutError() {
    checkoutError.value =
        fieldErrors.receiptNumber ??
        fieldErrors.studentIdNumber ??
        fieldErrors.studentName ??
        fieldErrors.purchaseDate ??
        ''
}

watch(receiptNumber, () => {
    if (fieldErrors.receiptNumber) {
        fieldErrors.receiptNumber = undefined
        syncCheckoutError()
    }
})

watch(studentIdNumber, () => {
    if (fieldErrors.studentIdNumber) {
        fieldErrors.studentIdNumber = undefined
        syncCheckoutError()
    }
})

watch(studentName, () => {
    if (fieldErrors.studentName) {
        fieldErrors.studentName = undefined
        syncCheckoutError()
    }
})

watch(purchaseDate, () => {
    if (fieldErrors.purchaseDate) {
        fieldErrors.purchaseDate = undefined
        syncCheckoutError()
    }
})

/*
|--------------------------------------------------------------------------
| Checkout
|--------------------------------------------------------------------------
*/

async function submitSale() {
    if (submitting.value) {
        return
    }

    const lines = props.cartLines

    if (lines.length === 0) {
        checkoutError.value = 'Your cart is empty.'
        return
    }

    const receipt = receiptNumber.value.trim()
    const studentId = studentIdNumber.value.trim()
    const student = studentName.value.trim()
    const purchaseDateIso = purchaseDate.value.trim()

    clearFieldErrors()

    if (!receipt) {
        fieldErrors.receiptNumber = 'Receipt number is required.'
    }

    if (!studentId) {
        fieldErrors.studentIdNumber = 'Student ID number is required.'
    }

    if (!student) {
        fieldErrors.studentName = 'Student name is required.'
    }

    // Parse as local midnight so the stored date matches the chosen calendar
    // day when it is formatted back for the receipt.
    const purchaseTimestamp = Date.parse(`${purchaseDateIso}T00:00:00`)
    if (!purchaseDateIso || Number.isNaN(purchaseTimestamp)) {
        fieldErrors.purchaseDate = 'A valid purchase date is required.'
    }

    const firstError =
        fieldErrors.receiptNumber ??
        fieldErrors.studentIdNumber ??
        fieldErrors.studentName ??
        fieldErrors.purchaseDate

    if (firstError) {
        checkoutError.value = firstError
        return
    }

    const purchaseDateValue = new Date(purchaseTimestamp).toISOString()
    const trimmedNotes = notes.value.trim() || undefined

    checkoutError.value = ''
    submitting.value = true

    try {
        const response = await strapi.post<{ data: SaleTransaction }>(
            '/cashier/issue',
            {
                items: lines.map((line) => ({
                    item: line.item.id,
                    qtyPulled: line.qty,
                })),
                notes: trimmedNotes,
                receiptNumber: receipt,
                studentIdNumber: studentId,
                studentName: student,
                purchaseDate: purchaseDateValue,
            }
        )

        const transaction = response?.data
        const result: Receipt = {
            id: transaction?.id ?? 0,
            total: props.cartTotal,
            notes: trimmedNotes,
            receiptNumber: transaction?.receiptNumber ?? receipt,
            studentIdNumber: transaction?.studentIdNumber ?? studentId,
            studentName: transaction?.studentName ?? student,
            purchaseDate: transaction?.purchaseDate ?? purchaseDateValue,
            lines: lines.map((line) => ({
                itemId: line.item.id,
                name: line.item.name,
                qty: line.qty,
                lineTotal: lineTotal(line),
            })),
        }

        open.value = false
        resetForm()
        emit('completed', result)
    } catch (err) {
        checkoutError.value =
            (err as Error).message ??
            'Failed to complete sale. Please try again.'
    } finally {
        submitting.value = false
    }
}
</script>

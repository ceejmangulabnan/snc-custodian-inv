<template>
    <UModal
        v-model:open="open"
        :ui="{
            content:
                'rounded-[28px] max-w-5xl max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden',
        }"
    >
        <template #content>
            <div
                v-if="recentTransaction"
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
                            Sale Transaction Details
                        </h2>

                        <p
                            class="mt-0.5 text-sm text-slate-500 dark:text-slate-400"
                        >
                            Review completed transaction details.
                        </p>
                    </div>
                </div>

                <!-- Display Transaction Details -->
                <!-- Scrollable Body -->
                <div class="mt-6 min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
                    <!-- Metadata Grid -->
                    <div
                        class="grid grid-cols-1 gap-3 rounded-2xl border border-green-100 bg-green-50/40 p-4 sm:grid-cols-2 dark:border-slate-700/80 dark:bg-slate-800/40"
                    >
                        <div>
                            <p
                                class="text-xs font-medium text-slate-500 dark:text-slate-400"
                            >
                                Receipt Number
                            </p>
                            <p
                                class="mt-0.5 font-mono text-sm font-semibold text-slate-800 dark:text-slate-200"
                            >
                                {{ recentTransaction.receiptNumber || '—' }}
                            </p>
                        </div>
                        <div>
                            <p
                                class="text-xs font-medium text-slate-500 dark:text-slate-400"
                            >
                                Purchase Date
                            </p>
                            <p
                                class="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                                {{
                                    formatPurchaseDate(
                                        recentTransaction.purchaseDate
                                    )
                                }}
                            </p>
                        </div>

                        <div>
                            <p
                                class="text-xs font-medium text-slate-500 dark:text-slate-400"
                            >
                                Student Name
                            </p>
                            <p
                                class="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200"
                            >
                                {{ recentTransaction.studentName || '—' }}
                            </p>
                        </div>

                        <div>
                            <p
                                class="text-xs font-medium text-slate-500 dark:text-slate-400"
                            >
                                Student ID Number
                            </p>
                            <p
                                class="mt-0.5 font-mono text-sm font-semibold text-slate-800 dark:text-slate-200"
                            >
                                {{ recentTransaction.studentIdNumber || '—' }}
                            </p>
                        </div>

                        <div>
                            <p
                                class="text-xs font-medium text-slate-500 dark:text-slate-400"
                            >
                                Processed By (Custodian)
                            </p>
                            <p
                                class="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200"
                            >
                                {{
                                    recentTransaction.custodian?.username ?? '—'
                                }}
                            </p>
                        </div>

                        <div>
                            <p
                                class="text-xs font-medium text-slate-500 dark:text-slate-400"
                            >
                                Transaction Type
                            </p>
                            <p
                                class="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                                {{ recentTransaction.type }}
                            </p>
                        </div>
                    </div>

                    <!-- Notes (if present) -->
                    <div
                        v-if="recentTransaction.notes"
                        class="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40"
                    >
                        <p
                            class="text-xs font-medium text-slate-500 dark:text-slate-400"
                        >
                            Notes
                        </p>
                        <p
                            class="mt-1 text-sm text-slate-700 dark:text-slate-300"
                        >
                            {{ recentTransaction.notes }}
                        </p>
                    </div>

                    <!-- Items List -->
                    <div>
                        <div class="mb-2.5 flex items-center justify-between">
                            <h3
                                class="text-sm font-semibold text-slate-800 dark:text-slate-200"
                            >
                                Items Purchased
                            </h3>
                            <span
                                class="text-xs text-slate-500 dark:text-slate-400"
                            >
                                {{ totalItemsPulled }} Total Quantity ({{
                                    recentTransaction.items?.length ?? 0
                                }}
                                line
                                {{
                                    recentTransaction.items?.length === 1
                                        ? 'item'
                                        : 'items'
                                }})
                            </span>
                        </div>

                        <div
                            class="overflow-hidden rounded-2xl border border-green-100 dark:border-slate-700"
                        >
                            <table class="w-full text-left text-sm">
                                <thead
                                    class="border-b border-green-100 bg-green-50/60 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                                >
                                    <tr>
                                        <th class="px-4 py-2.5">Item #</th>
                                        <th class="px-4 py-2.5 text-left">
                                            Item Name
                                        </th>
                                        <th class="px-4 py-2.5 text-right">
                                            Qty Pulled
                                        </th>
                                    </tr>
                                </thead>
                                <tbody
                                    class="divide-y divide-green-100 dark:divide-slate-700"
                                >
                                    <tr
                                        v-if="
                                            !recentTransaction.items ||
                                            recentTransaction.items.length === 0
                                        "
                                    >
                                        <td
                                            colspan="3"
                                            class="px-4 py-6 text-center text-xs text-slate-400"
                                        >
                                            No items recorded.
                                        </td>
                                    </tr>
                                    <tr
                                        v-for="item in recentTransaction.items"
                                        :key="item.id"
                                        class="hover:bg-green-50/30 dark:hover:bg-slate-800/40"
                                    >
                                        <td
                                            class="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200"
                                        >
                                            {{ item.item.sku }}
                                        </td>
                                        <td
                                            class="px-4 py-2.5 text-left font-medium text-slate-800 dark:text-slate-200"
                                        >
                                            {{ item.item.name }}
                                        </td>
                                        <td
                                            class="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-700 dark:text-slate-300"
                                        >
                                            {{ item.qtyPulled }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div
                    class="mt-6 flex justify-end border-t border-green-100 pt-4 dark:border-slate-700"
                >
                    <UButton
                        label="Close"
                        color="neutral"
                        variant="outline"
                        class="rounded-xl"
                        @click="open = false"
                    />
                </div>
            </div>
        </template>
    </UModal>
</template>

<script lang="ts" setup>
import type { RecentTransactionRow } from '#shared/types/transaction'

const open = defineModel<boolean>('open', { default: false })

const { recentTransaction } = defineProps<{
    recentTransaction: RecentTransactionRow | null
}>()

const totalItemsPulled = computed(() =>
    (recentTransaction?.items ?? []).reduce(
        (sum, item) => sum + item.qtyPulled,
        0
    )
)

function formatPurchaseDate(iso?: string | null): string {
    if (!iso) return '—'
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(iso))
}
</script>

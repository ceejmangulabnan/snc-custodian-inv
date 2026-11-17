<template>
    <div
        class="flex flex-col overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
        <div
            class="flex items-center gap-3 border-b border-green-100 bg-green-50/60 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/60"
        >
            <div
                class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-400"
            >
                <UIcon name="i-lucide-clock" class="size-5" />
            </div>

            <div>
                <p
                    class="text-sm font-semibold text-slate-800 dark:text-slate-200"
                >
                    Recent Transactions
                </p>

                <p class="text-xs text-slate-500 dark:text-slate-400">
                    Most recent first
                </p>
            </div>
        </div>

        <div class="pl-5 py-4">
            <p
                v-if="recentPending"
                class="py-6 text-center text-sm text-slate-400 dark:text-slate-500"
            >
                Loading transactions...
            </p>

            <p
                v-else-if="recentTransactions.length === 0"
                class="py-6 text-center text-sm text-slate-400 dark:text-slate-500"
            >
                No transactions yet.
            </p>

            <ul
                v-else
                class="max-h-96 divide-y divide-green-100 overflow-y-auto pr-4 dark:divide-slate-700"
            >
                <li
                    v-for="transaction in recentTransactions"
                    :key="transaction.id"
                    class="flex items-center gap-3 py-3"
                >
                    <div
                        class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-400"
                    >
                        <UIcon name="i-lucide-receipt-text" class="size-4" />
                    </div>

                    <div class="min-w-0 flex-1">
                        <p
                            class="truncate text-sm font-medium text-slate-800 dark:text-slate-200"
                        >
                            #{{ transaction.id }} ·
                            {{ transaction.custodian }}
                        </p>

                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            {{ transaction.date }}
                        </p>
                    </div>

                    <UBadge
                        :color="statusColor(transaction.status)"
                        variant="subtle"
                    >
                        {{ transaction.status }}
                    </UBadge>
                </li>
            </ul>
        </div>
    </div>
</template>
<script setup lang="ts">
import type { RecentTransactionRow } from '#shared/types/transaction'

const props = defineProps<{
    recentPending: boolean
    recentTransactions: RecentTransactionRow[]
}>()

const statusColor = (
    status: RecentTransactionRow['status']
): 'neutral' | 'success' | 'error' => {
    if (status === 'Completed') return 'success'
    if (status === 'Voided') return 'error'
    return 'neutral'
}
</script>

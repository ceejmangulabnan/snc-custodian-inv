<template>
    <UModal v-model:open="open" :ui="{ content: 'rounded-[28px] max-w-lg' }">
        <template #content>
            <div
                class="relative max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[28px] border border-green-100 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90"
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

                        <p
                            v-if="receipt?.receiptNumber"
                            class="mt-1 inline-flex items-center gap-1 rounded-lg bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400"
                        >
                            <UIcon
                                name="i-lucide-receipt-text"
                                class="size-3.5"
                            />
                            Receipt #{{ receipt.receiptNumber }}
                        </p>
                    </div>
                </div>

                <div
                    v-if="receipt?.studentName || receipt?.studentIdNumber"
                    class="mt-4 grid gap-3 rounded-2xl border border-green-100 bg-green-50/50 px-4 py-3 text-sm sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-800/50"
                >
                    <div v-if="receipt?.studentName">
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            Student
                        </p>

                        <p
                            class="font-semibold text-slate-800 dark:text-slate-200"
                        >
                            {{ receipt.studentName }}
                        </p>
                    </div>

                    <div v-if="receipt?.studentIdNumber">
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            Student ID
                        </p>

                        <p
                            class="font-semibold text-slate-800 dark:text-slate-200"
                        >
                            {{ receipt.studentIdNumber }}
                        </p>
                    </div>

                    <div v-if="receipt?.purchaseDate" class="sm:col-span-2">
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            Purchase Date & Time
                        </p>

                        <p
                            class="font-semibold text-slate-800 dark:text-slate-200"
                        >
                            {{ formatDate(receipt.purchaseDate) }}
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
                        @click="open = false"
                    >
                        New Sale
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import type { Receipt } from '#shared/types/cashier'

const open = defineModel<boolean>('open', { default: false })

defineProps<{ receipt: Receipt | null }>()

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
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(iso))
}
</script>

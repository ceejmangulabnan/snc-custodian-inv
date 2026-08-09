<template>
    <div class="space-y-6">
        <div class="flex items-start gap-4">
            <div
                class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 via-green-600 to-teal-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
            >
                <UIcon name="i-lucide-clipboard-list" class="size-7" />
            </div>

            <div>
                <h1
                    class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
                >
                    Transactions
                </h1>

                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    View transaction history and details.
                </p>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
definePageMeta({
    middleware: 'admin',
    layout: 'admin',
})
</script>

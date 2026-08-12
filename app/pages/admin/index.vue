<template>
    <div class="space-y-6">
        <div class="flex items-start gap-4">
            <div
                class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-green-500 via-green-600 to-teal-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
            >
                <UIcon name="i-lucide-layout-dashboard" class="size-7" />
            </div>

            <div>
                <h1
                    class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
                >
                    Admin Dashboard
                </h1>

                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Overview of recent activity, inventory movement, and
                    transaction history.
                </p>
            </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <NuxtLink
                v-for="stat in stats"
                :key="stat.label"
                :to="stat.to"
                class="group relative flex flex-col overflow-hidden rounded-3xl border border-green-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-green-200 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-green-800"
            >
                <div
                    class="relative flex flex-1 items-start justify-between gap-4 pb-4"
                >
                    <div>
                        <p
                            class="text-sm font-medium text-slate-500 dark:text-slate-400"
                        >
                            {{ stat.label }}
                        </p>

                        <p
                            class="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
                        >
                            {{ stat.value }}
                        </p>

                        <p
                            class="mt-1 text-xs text-slate-500 dark:text-slate-400"
                        >
                            {{ stat.description }}
                        </p>
                    </div>

                    <div
                        class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-lg"
                        :class="stat.tint"
                    >
                        <UIcon :name="stat.icon" class="size-6" />
                    </div>
                </div>

                <div
                    class="mt-auto flex items-end gap-1.5 border-t border-green-100 pt-4 text-sm font-medium text-green-600 dark:border-slate-700 dark:text-green-400"
                >
                    <span>{{ stat.footer }}</span>

                    <UIcon
                        name="i-lucide-arrow-right"
                        class="size-4 transition-transform group-hover:translate-x-1"
                    />
                </div>
            </NuxtLink>

            <!-- TODO: Add two cards for recent orders and low stock items. -->
        </div>
    </div>
</template>
<script setup lang="ts">
import type { InventoryItem } from '#shared/types/inventory'
import { sampleInventory as sampleInventoryData } from '#shared/data/inventory'

definePageMeta({
    layout: 'admin',
    middleware: 'admin',
})

const strapi = useStrapi()

const sampleInventory = ref<InventoryItem[]>(sampleInventoryData)

const { data: users } = await useAsyncData('dashboard-users', () =>
    strapi.get<{ id: number }[]>('/users')
)

const usersCount = computed(() => users.value?.length ?? 0)

const stats = computed(() => [
    {
        label: 'Inventory Items',
        description: 'Track stock levels and restocking needs',
        value: sampleInventory.value.length,
        icon: 'i-lucide-boxes',
        tint: 'from-green-500 via-green-600 to-teal-600',
        to: '/admin/inventory',
        footer: 'View Inventory',
    },
    {
        label: 'Total Users',
        description: 'User accounts and roles',
        value: usersCount.value,
        icon: 'i-lucide-users',
        tint: 'from-blue-500 to-indigo-600',
        to: '/admin/users',
        footer: 'Manage Users',
    },
    {
        // TODO: Should be fetched from backend
        label: 'Transactions',
        description: 'Transaction history',
        value: 0,
        icon: 'i-lucide-clipboard-list',
        tint: 'from-amber-500 to-orange-600',
        to: '/admin/transactions',
        footer: 'View Transactions',
    },
    {
        // TODO: Should be fetched from backend
        label: 'Audit Logs',
        description: 'Stock movement and user actions',
        value: 0,
        icon: 'i-lucide-history',
        tint: 'from-red-500 to-rose-600',
        to: '/admin/logs',
        footer: 'View Audit Logs',
    },
])
</script>

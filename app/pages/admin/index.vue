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
        </div>

        <!-- Recent activity -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- Recent orders -->
            <div
                class="overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
                <div
                    class="flex items-center justify-between gap-3 border-b border-green-100 p-5 dark:border-slate-700"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        >
                            <UIcon name="i-lucide-clipboard-list" class="size-5" />
                        </div>

                        <div>
                            <h2
                                class="text-base font-semibold text-slate-900 dark:text-white"
                            >
                                Recent Orders
                            </h2>

                            <p class="text-xs text-slate-500 dark:text-slate-400">
                                Latest inventory transactions
                            </p>
                        </div>
                    </div>

                    <NuxtLink
                        to="/admin/transactions"
                        class="flex shrink-0 items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400"
                    >
                        View all
                        <UIcon name="i-lucide-arrow-right" class="size-4" />
                    </NuxtLink>
                </div>

                <ul
                    v-if="recentOrders.length"
                    class="divide-y divide-green-100 dark:divide-slate-700"
                >
                    <li
                        v-for="order in recentOrders"
                        :key="order.id"
                        class="flex items-center gap-3 px-5 py-3"
                    >
                        <div
                            class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        >
                            <UIcon name="i-lucide-receipt-text" class="size-4" />
                        </div>

                        <div class="min-w-0 flex-1">
                            <p
                                class="truncate text-sm font-medium text-slate-800 dark:text-slate-200"
                            >
                                #{{ order.id }} · {{ order.custodian }}
                            </p>

                            <p class="text-xs text-slate-500 dark:text-slate-400">
                                {{ order.date }}
                            </p>
                        </div>

                        <UBadge
                            :color="orderColor(order.status)"
                            variant="subtle"
                        >
                            {{ order.status }}
                        </UBadge>
                    </li>
                </ul>

                <div
                    v-else
                    class="p-8 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                    No recent transactions yet.
                </div>
            </div>

            <!-- Low stock -->
            <div
                class="overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
                <div
                    class="flex items-center justify-between gap-3 border-b border-green-100 p-5 dark:border-slate-700"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400"
                        >
                            <UIcon name="i-lucide-alert-triangle" class="size-5" />
                        </div>

                        <div>
                            <h2
                                class="text-base font-semibold text-slate-900 dark:text-white"
                            >
                                Low Stock Items
                            </h2>

                            <p class="text-xs text-slate-500 dark:text-slate-400">
                                Items at or below minimum threshold
                            </p>
                        </div>
                    </div>

                    <NuxtLink
                        to="/admin/inventory"
                        class="flex shrink-0 items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400"
                    >
                        View all
                        <UIcon name="i-lucide-arrow-right" class="size-4" />
                    </NuxtLink>
                </div>

                <ul
                    v-if="lowStockItems.length"
                    class="divide-y divide-green-100 dark:divide-slate-700"
                >
                    <li
                        v-for="item in lowStockItems"
                        :key="item.id"
                        class="flex items-center gap-3 px-5 py-3"
                    >
                        <div
                            class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                        >
                            <UIcon name="i-lucide-box" class="size-4" />
                        </div>

                        <div class="min-w-0 flex-1">
                            <p
                                class="truncate text-sm font-medium text-slate-800 dark:text-slate-200"
                            >
                                {{ item.name }}
                            </p>

                            <p class="text-xs text-slate-500 dark:text-slate-400">
                                {{ item.category }}
                            </p>
                        </div>

                        <UBadge color="error" variant="subtle">
                            {{ item.stockQty }} / {{ item.minThreshold }}
                        </UBadge>
                    </li>
                </ul>

                <div
                    v-else
                    class="p-8 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                    All items are sufficiently stocked.
                </div>
            </div>
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

/*
|--------------------------------------------------------------------------
| Recent activity
|--------------------------------------------------------------------------
*/

interface StrapiRecentTransaction {
    id: number
    createdAt: string
    orderStatus: 'Pending' | 'Completed' | 'Voided'
    custodian: {
        id: number
        username: string
    } | null
}

interface RecentOrder {
    id: number
    date: string
    custodian: string
    status: 'Pending' | 'Completed' | 'Voided'
}

const { data: recentTransactions } = await useAsyncData(
    'dashboard-recent-transactions',
    () =>
        strapi.get<{ data: StrapiRecentTransaction[] }>('/transactions', {
            populate: 'custodian',
            sort: 'createdAt:desc',
            pagination: { limit: 5 },
        })
)

const recentOrders = computed<RecentOrder[]>(() =>
    (recentTransactions.value?.data ?? []).map((transaction) => ({
        id: transaction.id,
        date: formatDate(transaction.createdAt),
        custodian: transaction.custodian?.username ?? '—',
        status: transaction.orderStatus,
    }))
)

const { data: transactionCount } = await useAsyncData(
    'dashboard-transaction-count',
    () =>
        strapi.get<{ meta: { pagination: { total: number } } }>(
            '/transactions',
            { pagination: { limit: 1 } }
        )
)

const { data: auditLogCount } = await useAsyncData(
    'dashboard-audit-log-count',
    () =>
        strapi.get<{ meta: { pagination: { total: number } } }>('/audit-logs', {
            pagination: { limit: 1 },
        })
)

const lowStockItems = computed(() =>
    sampleInventory.value
        .filter((item) => item.stockQty <= item.minThreshold)
        .slice(0, 4)
)

function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(iso))
}

const orderColor = (
    status: RecentOrder['status']
): 'neutral' | 'success' | 'error' => {
    if (status === 'Completed') return 'success'
    if (status === 'Voided') return 'error'
    return 'neutral'
}

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
        label: 'Transactions',
        description: 'Transaction history',
        value: transactionCount.value?.meta?.pagination?.total ?? 0,
        icon: 'i-lucide-clipboard-list',
        tint: 'from-amber-500 to-orange-600',
        to: '/admin/transactions',
        footer: 'View Transactions',
    },
    {
        label: 'Audit Logs',
        description: 'Stock movement and user actions',
        value: auditLogCount.value?.meta?.pagination?.total ?? 0,
        icon: 'i-lucide-history',
        tint: 'from-red-500 to-rose-600',
        to: '/admin/logs',
        footer: 'View Audit Logs',
    },
])
</script>

<template>
    <div class="space-y-6">
        <!-- Page header -->
        <div class="flex items-start gap-4">
            <div
                class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-[0_10px_30px_rgba(239,68,68,0.35)]"
            >
                <UIcon name="i-lucide-history" class="size-7" />
            </div>

            <div>
                <h1
                    class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
                >
                    Audit Logs
                </h1>

                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Track stock movement and user actions.
                </p>
            </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div
                v-for="stat in stats"
                :key="stat.label"
                class="group relative overflow-hidden rounded-3xl border border-green-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
                <div class="relative flex items-center justify-between">
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
                    </div>

                    <div
                        class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg"
                        :class="stat.tint"
                    >
                        <UIcon :name="stat.icon" class="size-6" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading state -->
        <div
            v-if="pending"
            class="flex items-center justify-center rounded-3xl border border-green-100 bg-white p-12 dark:border-slate-700 dark:bg-slate-900"
        >
            <span class="text-sm text-slate-500 dark:text-slate-400">
                Loading audit logs...
            </span>
        </div>

        <template v-else>
            <!-- Sample data notice -->
            <UAlert
                v-if="usingSampleData"
                color="info"
                variant="soft"
                icon="i-lucide-database"
                title="Showing sample data"
                description="No backend audit entries recorded yet, so premade sample entries are shown instead."
                :actions="[
                    {
                        label: 'Retry',
                        icon: 'i-lucide-refresh-cw',
                        color: 'info',
                        variant: 'outline',
                        onClick: () => refresh(),
                    },
                ]"
            />

            <!-- Audit log table -->
            <div
                class="overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
                <!-- Table header -->
                <div
                    class="flex flex-col gap-4 border-b border-green-100 p-5 lg:flex-row lg:items-center lg:justify-between dark:border-slate-700"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400"
                        >
                            <UIcon name="i-lucide-scroll-text" class="size-5" />
                        </div>

                        <div>
                            <h2
                                class="text-base font-semibold text-slate-900 dark:text-white"
                            >
                                Activity Log
                            </h2>

                            <p
                                class="text-xs text-slate-500 dark:text-slate-400"
                            >
                                {{ filteredLogs.length }} of
                                {{ logs.length }} events
                            </p>
                        </div>
                    </div>

                    <div
                        class="flex flex-col gap-3 sm:flex-row sm:items-center"
                    >
                        <UInput
                            v-model="search"
                            icon="i-lucide-search"
                            placeholder="Search user, action, target..."
                            size="lg"
                            class="w-full sm:w-72"
                        />

                        <UButton
                            v-if="hasActiveFilters"
                            color="neutral"
                            variant="ghost"
                            icon="i-lucide-x"
                            size="lg"
                            @click="clearFilters"
                        >
                            Clear Filters
                        </UButton>
                    </div>
                </div>

                <!-- Filters -->
                <div
                    class="grid grid-cols-1 gap-2 gap-x-4 border-b border-green-100 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 dark:border-slate-700"
                >
                    <UFormField label="Date">
                        <UInput
                            v-model="dateFilter"
                            type="date"
                            class="w-full"
                        />
                    </UFormField>

                    <UFormField label="User">
                        <USelect
                            v-model="userFilter"
                            :items="userOptions"
                            class="w-full"
                        />
                    </UFormField>

                    <UFormField label="Action">
                        <USelect
                            v-model="actionFilter"
                            :items="actionOptions"
                            class="w-full"
                        />
                    </UFormField>

                    <UFormField label="Target">
                        <UInput
                            v-model="targetFilter"
                            icon="i-lucide-search"
                            placeholder="Search target..."
                            class="w-full"
                        />
                    </UFormField>

                    <UFormField label="Category">
                        <USelect
                            v-model="category"
                            :items="categoryOptions"
                            class="w-full"
                        />
                    </UFormField>
                </div>

                <!-- Table -->
                <UTable
                    :data="filteredLogs"
                    :columns="columns"
                    v-model:global-filter="search"
                    v-model:sorting="sorting"
                    :empty="'No log entries match your filters.'"
                    class="flex-1"
                >
                    <template #timestamp-cell="{ row }">
                        <span
                            class="text-sm text-slate-700 dark:text-slate-200"
                        >
                            {{ formatTimestamp(row.original.timestamp) }}
                        </span>
                    </template>

                    <template #action-cell="{ row }">
                        <UBadge
                            :color="actionColor(row.original.action)"
                            variant="subtle"
                        >
                            {{ row.original.action }}
                        </UBadge>
                    </template>

                    <template #category-cell="{ row }">
                        <UBadge
                            :color="categoryColor(row.original.category)"
                            variant="soft"
                        >
                            {{ row.original.category }}
                        </UBadge>
                    </template>
                </UTable>

                <!-- Table footer -->
                <div
                    class="flex items-center justify-between border-t border-green-100 px-5 py-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"
                >
                    <p>Newest events first</p>

                    <p>Updated just now</p>
                </div>
            </div>
        </template>
    </div>
</template>
<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { SortingState } from '@tanstack/vue-table'
import type {
    AuditLogAction,
    AuditLogCategory,
    AuditLogEntry,
} from '#shared/types/audit-log'
import { sampleAuditLogs as sampleAuditLogsData } from '#shared/data/audit-logs'

definePageMeta({
    layout: 'admin',
    middleware: 'admin',
})

/*
|--------------------------------------------------------------------------
  | Strapi datla
|--------------------------------------------------------------------------
*/

interface StrapiAuditLog {
    id: number
    action: AuditLogAction
    target?: string | null
    category: AuditLogCategory
    user: {
        id: number
        username: string
    } | null
    createdAt: string
}

const strapi = useStrapi()

const {
    data: logsResponse,
    error: fetchError,
    pending,
    refresh,
} = await useAsyncData('fetchAuditLogs', () =>
    strapi.get<{ data: StrapiAuditLog[] }>('/audit-logs', {
        populate: 'user',
        sort: 'createdAt:desc',
        'pagination[pageSize]': 100,
    })
)

const usingSampleData = computed(() => {
    return !!fetchError.value || !logsResponse.value?.data?.length
})

const logs = computed<AuditLogEntry[]>(() => {
    if (usingSampleData.value) {
        return sampleAuditLogsData
    }

    return (logsResponse.value?.data ?? []).map((log) => ({
        id: log.id,
        timestamp: log.createdAt,
        user: log.user?.username ?? 'system',
        action: log.action,
        target: log.target ?? '',
        category: log.category,
    }))
})

/*
|--------------------------------------------------------------------------
| Filters
|--------------------------------------------------------------------------
*/

const search = ref('')
const dateFilter = ref('')
const userFilter = ref('all')
const actionFilter = ref('all')
const category = ref('all')
const targetFilter = ref('')
const sorting = ref<SortingState>([])

const categories = computed(() => {
    return [...new Set(logs.value.map((log) => log.category))].sort()
})

const categoryOptions = computed(() => [
    { label: 'All Categories', value: 'all' },
    ...categories.value.map((item) => ({ label: item, value: item })),
])

const users = computed(() => {
    return [...new Set(logs.value.map((log) => log.user))].sort()
})

const userOptions = computed(() => [
    { label: 'All Users', value: 'all' },
    ...users.value.map((item) => ({ label: item, value: item })),
])

const actions = computed(() => {
    return [...new Set(logs.value.map((log) => log.action))].sort()
})

const actionOptions = computed(() => [
    { label: 'All Actions', value: 'all' },
    ...actions.value.map((item) => ({ label: item, value: item })),
])

const hasActiveFilters = computed(() => {
    return (
        search.value !== '' ||
        dateFilter.value !== '' ||
        userFilter.value !== 'all' ||
        actionFilter.value !== 'all' ||
        category.value !== 'all' ||
        targetFilter.value !== ''
    )
})

function clearFilters() {
    search.value = ''
    dateFilter.value = ''
    userFilter.value = 'all'
    actionFilter.value = 'all'
    category.value = 'all'
    targetFilter.value = ''
}

function toDateKey(iso: string): string {
    const date = new Date(iso)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const filteredLogs = computed(() => {
    return logs.value.filter((log) => {
        if (dateFilter.value && toDateKey(log.timestamp) !== dateFilter.value) {
            return false
        }

        if (userFilter.value !== 'all' && log.user !== userFilter.value) {
            return false
        }

        if (actionFilter.value !== 'all' && log.action !== actionFilter.value) {
            return false
        }

        if (category.value !== 'all' && log.category !== category.value) {
            return false
        }

        if (
            targetFilter.value &&
            !log.target.toLowerCase().includes(targetFilter.value.toLowerCase())
        ) {
            return false
        }

        return true
    })
})

/*
|--------------------------------------------------------------------------
| Stats
|--------------------------------------------------------------------------
*/

const countByCategory = (name: AuditLogCategory) =>
    logs.value.filter((log) => log.category === name).length

const stats = computed(() => [
    {
        label: 'Total Events',
        value: logs.value.length,
        icon: 'i-lucide-history',
        tint: 'from-red-500 to-rose-600',
    },
    {
        label: 'Auth Events',
        value: countByCategory('Auth'),
        icon: 'i-lucide-shield-check',
        tint: 'from-blue-500 to-indigo-600',
    },
    {
        label: 'Inventory Events',
        value: countByCategory('Inventory'),
        icon: 'i-lucide-boxes',
        tint: 'from-green-500 via-green-600 to-teal-600',
    },
    {
        label: 'Transaction Events',
        value: countByCategory('Transaction'),
        icon: 'i-lucide-clipboard-list',
        tint: 'from-amber-500 to-orange-600',
    },
])

/*
|--------------------------------------------------------------------------
| Table
|--------------------------------------------------------------------------
*/

const categoryColor = (
    value: AuditLogCategory
): 'info' | 'success' | 'warning' | 'error' | 'neutral' => {
    switch (value) {
        case 'Auth':
            return 'info'
        case 'Inventory':
            return 'success'
        case 'Transaction':
            return 'warning'
        case 'User':
            return 'error'
        default:
            return 'neutral'
    }
}

const actionColor = (
    value: AuditLogAction
): 'info' | 'success' | 'warning' | 'error' | 'neutral' => {
    switch (value) {
        case 'Login':
        case 'Logout':
            return 'info'
        case 'Stock In':
        case 'Transaction Completed':
            return 'success'
        case 'Stock Out':
        case 'Threshold Reached':
            return 'warning'
        case 'Transaction Voided':
        case 'Item Deleted':
        case 'User Deleted':
            return 'error'
        default:
            return 'neutral'
    }
}

function formatTimestamp(iso: string): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
    }).format(new Date(iso))
}

const columns: TableColumn<AuditLogEntry>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
        enableSorting: false,
    },
    {
        accessorKey: 'timestamp',
        header: 'Date / Time',
    },
    {
        accessorKey: 'user',
        header: 'User',
    },
    {
        id: 'action',
        header: 'Action',
        enableSorting: false,
    },
    {
        accessorKey: 'target',
        header: 'Target',
    },
    {
        id: 'category',
        header: 'Category',
        enableSorting: false,
    },
]
</script>

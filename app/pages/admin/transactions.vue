<template>
    <div class="space-y-6">
        <!-- Page header -->
        <div class="flex items-start gap-4">
            <div
                class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_10px_30px_rgba(245,158,11,0.35)]"
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
                Loading transactions...
            </span>
        </div>

        <!-- Fetch error -->
        <UAlert
            v-else-if="fetchError"
            color="error"
            variant="soft"
            icon="i-lucide-triangle-alert"
            :title="errorMessage"
            description="Check that the backend is running and try again."
            :actions="[
                {
                    label: 'Retry',
                    icon: 'i-lucide-refresh-cw',
                    color: 'error',
                    variant: 'outline',
                    onClick: () => refresh(),
                },
            ]"
        />

        <!-- Transactions table -->
        <div
            v-else
            class="overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
            <!-- Table header -->
            <div
                class="flex flex-col gap-4 border-b border-green-100 p-5 lg:flex-row lg:items-center lg:justify-between dark:border-slate-700"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    >
                        <UIcon name="i-lucide-list" class="size-5" />
                    </div>

                    <div>
                        <h2
                            class="text-base font-semibold text-slate-900 dark:text-white"
                        >
                            Transaction History
                        </h2>

                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            {{ transactions.length }} total transactions
                        </p>
                    </div>
                </div>

                <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <UInput
                        v-model="search"
                        icon="i-lucide-search"
                        placeholder="Search custodian, item, notes..."
                        size="lg"
                        class="w-full sm:w-72"
                    />

                    <USelect
                        v-model="status"
                        :items="statusOptions"
                        size="lg"
                        class="w-full sm:w-56"
                    />
                </div>
            </div>

            <!-- Table -->
            <UTable
                :data="filteredTransactions"
                :columns="columns"
                v-model:global-filter="search"
                v-model:sorting="sorting"
                :empty="'No transactions match your filters.'"
                class="flex-1"
            >
                <template #date-cell="{ row }">
                    <span class="text-sm text-slate-700 dark:text-slate-200">
                        {{ formatDate(row.original.date) }}
                    </span>
                </template>

                <template #status-cell="{ row }">
                    <UBadge
                        :color="statusColor(row.original.status)"
                        variant="subtle"
                        :icon="statusIcon(row.original.status)"
                    >
                        {{ row.original.status }}
                    </UBadge>
                </template>

                <template #notes-cell="{ row }">
                    <span
                        :class="
                            row.original.notes
                                ? 'text-slate-600 dark:text-slate-300'
                                : 'text-slate-400 dark:text-slate-500'
                        "
                    >
                        {{ row.original.notes || '—' }}
                    </span>
                </template>
            </UTable>

            <!-- Table footer -->
            <div
                class="flex items-center justify-between border-t border-green-100 px-5 py-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"
            >
                <p>{{ pendingTransactions.length }} pending transactions</p>

                <p>Updated just now</p>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { SortingState } from '@tanstack/vue-table'

definePageMeta({
    layout: 'admin',
    middleware: 'admin',
})

/*
|--------------------------------------------------------------------------
| Strapi data
|--------------------------------------------------------------------------
*/

interface StrapiTransactionItem {
    id: number
    qtyPulled: number
    item: {
        id: number
        name: string
        sku: string
    } | null
}

interface StrapiTransaction {
    id: number
    orderStatus: 'Pending' | 'Completed' | 'Voided'
    notes?: string | null
    custodian: {
        id: number
        username: string
        email?: string
    } | null
    items: StrapiTransactionItem[]
    createdAt: string
}

interface TransactionRow {
    id: number
    date: string
    custodian: string
    itemCount: number
    totalQty: number
    status: 'Pending' | 'Completed' | 'Voided'
    notes: string
}

const strapi = useStrapi()

const {
    data: transactionsResponse,
    error: fetchError,
    pending,
    refresh,
} = await useAsyncData('fetchTransactions', () =>
    strapi.get<{ data: StrapiTransaction[] }>('/transactions', {
        populate: 'custodian,items.item',
        sort: 'createdAt:desc',
        'pagination[pageSize]': 100,
    })
)

const transactions = computed<TransactionRow[]>(() =>
    (transactionsResponse.value?.data ?? []).map((transaction) => ({
        id: transaction.id,
        date: transaction.createdAt,
        custodian: transaction.custodian?.username ?? '—',
        itemCount: transaction.items.length,
        totalQty: transaction.items.reduce(
            (sum, line) => sum + line.qtyPulled,
            0
        ),
        status: transaction.orderStatus,
        notes: transaction.notes ?? '',
    }))
)

const errorMessage = computed(() => {
    const err = fetchError.value as { data?: { statusMessage?: string } } | null
    return err?.data?.statusMessage ?? 'Failed to load transactions'
})

/*
|--------------------------------------------------------------------------
| Filters
|--------------------------------------------------------------------------
*/

const search = ref('')
const status = ref('all')
const sorting = ref<SortingState>([])

const statusOptions = computed(() => [
    { label: 'All Statuses', value: 'all' },
    ...(['Pending', 'Completed', 'Voided'] as const).map((item) => ({
        label: item,
        value: item,
    })),
])

const filteredTransactions = computed(() => {
    if (status.value === 'all') {
        return transactions.value
    }

    return transactions.value.filter(
        (transaction) => transaction.status === status.value
    )
})

/*
|--------------------------------------------------------------------------
| Stats
|--------------------------------------------------------------------------
*/

const pendingTransactions = computed(() =>
    transactions.value.filter((item) => item.status === 'Pending')
)

const completedTransactions = computed(() =>
    transactions.value.filter((item) => item.status === 'Completed')
)

const voidedTransactions = computed(() =>
    transactions.value.filter((item) => item.status === 'Voided')
)

const stats = computed(() => [
    {
        label: 'Total Transactions',
        value: transactions.value.length,
        icon: 'i-lucide-clipboard-list',
        tint: 'from-amber-500 to-orange-600',
    },
    {
        label: 'Pending',
        value: pendingTransactions.value.length,
        icon: 'i-lucide-hourglass',
        tint: 'from-slate-500 to-slate-700',
    },
    {
        label: 'Completed',
        value: completedTransactions.value.length,
        icon: 'i-lucide-circle-check',
        tint: 'from-green-500 via-green-600 to-teal-600',
    },
    {
        label: 'Voided',
        value: voidedTransactions.value.length,
        icon: 'i-lucide-ban',
        tint: 'from-red-500 to-rose-600',
    },
])

/*
|--------------------------------------------------------------------------
| Table
|--------------------------------------------------------------------------
*/

const statusColor = (
    value: TransactionRow['status']
): 'neutral' | 'success' | 'error' => {
    if (value === 'Completed') return 'success'
    if (value === 'Voided') return 'error'
    return 'neutral'
}

const statusIcon = (value: TransactionRow['status']): string => {
    if (value === 'Completed') return 'i-lucide-circle-check'
    if (value === 'Voided') return 'i-lucide-ban'
    return 'i-lucide-hourglass'
}

function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(iso))
}

const columns: TableColumn<TransactionRow>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
        enableSorting: false,
    },
    {
        accessorKey: 'date',
        header: 'Date',
    },
    {
        accessorKey: 'custodian',
        header: 'Custodian',
    },
    {
        accessorKey: 'itemCount',
        header: 'Items',
        enableSorting: false,
    },
    {
        accessorKey: 'totalQty',
        header: 'Qty',
        enableSorting: false,
    },
    {
        id: 'status',
        header: 'Status',
        enableSorting: false,
    },
    {
        id: 'notes',
        header: 'Notes',
        enableSorting: false,
    },
]
</script>

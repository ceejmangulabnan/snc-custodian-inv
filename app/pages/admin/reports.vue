<template>
    <div class="space-y-6 print:space-y-4">
        <!-- Print-only report heading -->
        <div class="hidden print:mb-6 print:block">
            <div
                class="flex items-end justify-between border-b-2 border-slate-900 pb-3"
            >
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-black">
                        Sales Report
                    </h1>
                    <p class="mt-1 text-sm text-slate-600">
                        School Property &amp; Inventory
                    </p>
                </div>

                <div class="text-right text-sm text-slate-700">
                    <p class="font-semibold">{{ appliedRange.label }}</p>
                    <p>Generated {{ generatedAt }}</p>
                </div>
            </div>
        </div>

        <!-- Page header -->
        <div
            class="flex w-full flex-col gap-4 items-start justify-between sm:flex-row sm:items-center print:hidden"
        >
            <div class="flex items-start gap-4">
                <div
                    class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
                >
                    <UIcon
                        name="i-lucide-chart-no-axes-column"
                        class="size-7"
                    />
                </div>

                <div>
                    <h1
                        class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
                    >
                        Sales Reports
                    </h1>

                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Completed sales performance by period, item, and
                        cashier.
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <UButton
                    icon="i-lucide-printer"
                    color="neutral"
                    variant="subtle"
                    size="lg"
                    :loading="printPending"
                    class="rounded-2xl"
                    @click="preparePrint"
                >
                    Print
                </UButton>

                <UButton
                    icon="i-lucide-download"
                    color="success"
                    size="lg"
                    :loading="exportPending"
                    class="rounded-2xl"
                    @click="exportCsv"
                >
                    Export CSV
                </UButton>

                <UButton
                    icon="i-lucide-rotate-cw"
                    color="neutral"
                    variant="subtle"
                    size="lg"
                    :loading="pending"
                    class="rounded-2xl"
                    aria-label="Refresh report"
                    @click="refresh()"
                />
            </div>
        </div>

        <!-- Period controls -->
        <div
            class="rounded-3xl border border-green-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 print:hidden"
        >
            <div class="flex flex-col gap-4 lg:flex-row lg:items-end">
                <div class="space-y-2">
                    <p
                        class="text-xs font-semibold text-slate-500 uppercase dark:text-slate-400"
                    >
                        Period
                    </p>

                    <div class="flex flex-wrap gap-2">
                        <UButton
                            v-for="mode in periodModes"
                            :key="mode.value"
                            :color="
                                periodMode === mode.value
                                    ? 'primary'
                                    : 'neutral'
                            "
                            :variant="
                                periodMode === mode.value ? 'solid' : 'subtle'
                            "
                            size="lg"
                            class="rounded-xl"
                            @click="periodMode = mode.value"
                        >
                            {{ mode.label }}
                        </UButton>
                    </div>
                </div>

                <div
                    class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end"
                >
                    <div v-if="periodMode === 'monthly'" class="space-y-2">
                        <label
                            for="report-month"
                            class="block text-xs font-semibold text-slate-500 uppercase dark:text-slate-400"
                        >
                            Month
                        </label>

                        <UInput
                            id="report-month"
                            v-model="month"
                            type="month"
                            size="lg"
                            class="w-full sm:w-52"
                        />
                    </div>

                    <div v-else-if="periodMode === 'yearly'" class="space-y-2">
                        <label
                            for="report-year"
                            class="block text-xs font-semibold text-slate-500 uppercase dark:text-slate-400"
                        >
                            Year
                        </label>

                        <USelect
                            id="report-year"
                            v-model="year"
                            :items="yearOptions"
                            size="lg"
                            class="w-full sm:w-40"
                        />
                    </div>

                    <template v-else>
                        <div class="space-y-2">
                            <label
                                for="report-start"
                                class="block text-xs font-semibold text-slate-500 uppercase dark:text-slate-400"
                            >
                                From
                            </label>

                            <UInput
                                id="report-start"
                                v-model="manualStart"
                                type="date"
                                size="lg"
                                class="w-full sm:w-48"
                            />
                        </div>

                        <div class="space-y-2">
                            <label
                                for="report-end"
                                class="block text-xs font-semibold text-slate-500 uppercase dark:text-slate-400"
                            >
                                To
                            </label>

                            <UInput
                                id="report-end"
                                v-model="manualEnd"
                                type="date"
                                size="lg"
                                class="w-full sm:w-48"
                            />
                        </div>
                    </template>

                    <UButton
                        icon="i-lucide-check"
                        color="primary"
                        size="lg"
                        class="rounded-xl"
                        :disabled="invalidRange"
                        @click="applyPeriod"
                    >
                        Apply
                    </UButton>
                </div>
            </div>

            <p v-if="invalidRange" class="mt-3 text-sm text-red-600">
                The start date must be on or before the end date.
            </p>

            <p class="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Showing:
                <span class="font-semibold text-slate-700 dark:text-slate-200">
                    {{ appliedRange.label }}
                </span>
                · Dates use purchase date when available, otherwise the
                transaction date.
            </p>
        </div>

        <!-- Fetch error -->
        <UAlert
            v-if="fetchError"
            color="error"
            variant="soft"
            icon="i-lucide-triangle-alert"
            title="Could not load sales report"
            :description="fetchError"
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

        <div
            v-else-if="pending && !report"
            class="flex items-center justify-center rounded-3xl border border-green-100 bg-white py-16 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
        >
            <UIcon
                name="i-lucide-loader-circle"
                class="mr-2 size-5 animate-spin"
            />
            Building report…
        </div>

        <template v-else-if="report">
            <!-- Summary cards -->
            <div
                class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
            >
                <div
                    v-for="stat in stats"
                    :key="stat.label"
                    class="rounded-3xl border border-green-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                    <p
                        class="text-xs font-medium text-slate-500 dark:text-slate-400"
                    >
                        {{ stat.label }}
                    </p>

                    <p
                        class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
                    >
                        {{ stat.value }}
                    </p>
                </div>
            </div>

            <!-- Trend -->
            <div
                class="rounded-3xl border border-green-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
                <div class="mb-5 flex items-center gap-3">
                    <div
                        class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-400"
                    >
                        <UIcon name="i-lucide-chart-column" class="size-5" />
                    </div>

                    <div>
                        <h2
                            class="text-base font-semibold text-slate-900 dark:text-white"
                        >
                            Sales Trend
                        </h2>

                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            Completed sales per
                            {{
                                appliedRange.granularity === 'month'
                                    ? 'month'
                                    : 'day'
                            }}
                        </p>
                    </div>
                </div>

                <div v-if="report.buckets.length" class="space-y-4">
                    <div v-for="bucket in report.buckets" :key="bucket.key">
                        <div
                            class="mb-1.5 flex items-center justify-between gap-3 text-xs"
                        >
                            <span
                                class="font-medium text-slate-700 dark:text-slate-200"
                            >
                                {{ bucket.label }}
                            </span>

                            <span class="text-slate-500 dark:text-slate-400">
                                {{ bucket.sales }} sale{{
                                    bucket.sales === 1 ? '' : 's'
                                }}
                                · {{ bucket.units }} units ·
                                {{ formatMoney(bucket.revenue) }}
                            </span>
                        </div>

                        <div
                            class="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                        >
                            <div
                                class="h-full rounded-full bg-gradient-to-r from-green-500 to-teal-500"
                                :style="{
                                    width: `${(bucket.sales / maxBucketSales) * 100}%`,
                                }"
                            />
                        </div>
                    </div>
                </div>

                <p
                    v-else
                    class="py-6 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                    No completed sales in this period.
                </p>
            </div>

            <!-- Top items and cashiers -->
            <div class="grid grid-cols-1 gap-4">
                <div
                    class="overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                    <div
                        class="border-b border-green-100 px-5 py-4 dark:border-slate-700"
                    >
                        <h2
                            class="text-base font-semibold text-slate-900 dark:text-white"
                        >
                            Top Items
                        </h2>

                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            Ranked by units sold
                        </p>
                    </div>

                    <UTable
                        :data="report.topItems"
                        :columns="itemColumns"
                        :empty="'No items sold in this period.'"
                    >
                        <template #revenue-cell="{ row }">
                            <span class="text-sm font-medium">
                                {{ formatMoney(row.original.revenue) }}
                            </span>
                        </template>
                    </UTable>
                </div>
            </div>

            <!-- Transaction detail (screen only; print uses the full table below) -->
            <div
                class="overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 print:hidden"
            >
                <div
                    class="flex flex-col gap-4 border-b border-green-100 p-5 lg:flex-row lg:items-center lg:justify-between dark:border-slate-700"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-400"
                        >
                            <UIcon
                                name="i-lucide-receipt-text"
                                class="size-5"
                            />
                        </div>

                        <div>
                            <h2
                                class="text-base font-semibold text-slate-900 dark:text-white"
                            >
                                Sale Details
                            </h2>

                            <p
                                class="text-xs text-slate-500 dark:text-slate-400"
                            >
                                {{ report.detail.meta.total }} completed sale{{
                                    report.detail.meta.total === 1 ? '' : 's'
                                }}
                                in this period
                            </p>
                        </div>
                    </div>

                    <UInput
                        v-model="search"
                        icon="i-lucide-search"
                        placeholder="Search receipt, student, cashier..."
                        size="lg"
                        class="w-full lg:w-80"
                    />
                </div>

                <UTable
                    v-model:sorting="sorting"
                    v-model:pagination="pagination"
                    v-model:expanded="expandedRows"
                    :data="report.detail.rows"
                    :columns="detailColumns"
                    :loading="pending"
                    :pagination-options="{ manualPagination: true }"
                    :sorting-options="{ manualSorting: true }"
                    :empty="'No sales match your search.'"
                    class="flex-1"
                >
                    <template #expand-cell="{ row }">
                        <UButton
                            :icon="
                                row.getIsExpanded()
                                    ? 'i-lucide-chevron-down'
                                    : 'i-lucide-chevron-right'
                            "
                            color="neutral"
                            variant="ghost"
                            size="sm"
                            aria-label="Toggle line items"
                            @click="row.toggleExpanded()"
                        />
                    </template>

                    <template #expanded="{ row }">
                        <div class="px-4 py-3">
                            <ul
                                class="divide-y divide-green-100 overflow-hidden rounded-2xl border border-green-100 dark:divide-slate-700 dark:border-slate-700"
                            >
                                <li
                                    v-for="line in row.original.lines"
                                    :key="`${row.original.documentId}-${line.itemId}`"
                                    class="flex items-center gap-3 px-4 py-2.5"
                                >
                                    <div
                                        class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400"
                                    >
                                        <UIcon
                                            name="i-lucide-package"
                                            class="size-4"
                                        />
                                    </div>

                                    <div class="min-w-0 flex-1">
                                        <p
                                            class="truncate text-sm font-medium text-slate-800 dark:text-slate-200"
                                        >
                                            {{ line.name }}
                                        </p>

                                        <p
                                            class="text-xs text-slate-500 dark:text-slate-400"
                                        >
                                            {{ line.sku || 'No SKU' }} ·
                                            {{ formatMoney(line.unitPrice) }}
                                            each
                                        </p>
                                    </div>

                                    <span
                                        class="shrink-0 text-sm text-slate-600 dark:text-slate-300"
                                    >
                                        {{ line.qtyPulled }} ×
                                        {{ formatMoney(line.unitPrice) }}
                                    </span>

                                    <span
                                        class="w-24 shrink-0 text-right text-sm font-semibold text-slate-700 dark:text-slate-200"
                                    >
                                        {{ formatMoney(line.lineTotal) }}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </template>

                    <template #receipt-cell="{ row }">
                        <span
                            class="text-sm font-medium text-slate-800 dark:text-slate-100"
                        >
                            {{ row.original.receiptNumber || '—' }}
                        </span>
                    </template>

                    <template #date-cell="{ row }">
                        <span
                            class="text-sm text-slate-700 dark:text-slate-200"
                        >
                            {{ formatDateTime(row.original.effectiveDate) }}
                        </span>
                    </template>

                    <template #student-cell="{ row }">
                        <span
                            class="text-sm text-slate-700 dark:text-slate-200"
                        >
                            {{
                                row.original.studentName ||
                                row.original.studentIdNumber ||
                                '—'
                            }}
                        </span>
                    </template>

                    <template #units-cell="{ row }">
                        <span
                            class="text-sm text-slate-700 dark:text-slate-200"
                        >
                            {{
                                row.original.lines.reduce(
                                    (sum, line) => sum + line.qtyPulled,
                                    0
                                )
                            }}
                        </span>
                    </template>

                    <template #total-cell="{ row }">
                        <span
                            class="text-sm font-semibold text-slate-800 dark:text-slate-100"
                        >
                            {{ formatMoney(row.original.total) }}
                        </span>
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

                <div
                    class="flex flex-col gap-4 border-t border-green-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between dark:border-slate-700"
                >
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                        Page {{ report.detail.meta.page }} of
                        {{ report.detail.meta.pageCount }}
                    </p>

                    <div class="flex items-center justify-between gap-4">
                        <USelect
                            v-model="pageSize"
                            :items="pageSizeOptions"
                            size="sm"
                            class="w-32"
                        />

                        <UPagination
                            v-model:page="page"
                            :total="report.detail.meta.total"
                            :items-per-page="pagination.pageSize"
                            :show-edges="true"
                            :show-controls="true"
                            size="sm"
                        />
                    </div>
                </div>
            </div>

            <!-- Print-only detail table (full period) -->
            <div class="hidden print:mt-6 print:block">
                <h2 class="mb-2 text-base font-bold text-black">
                    Sale Details
                </h2>

                <table class="w-full border-collapse text-xs">
                    <thead>
                        <tr class="border-b-2 border-slate-900 text-left">
                            <th class="py-1.5 pr-2">Receipt</th>
                            <th class="py-1.5 pr-2">Date</th>
                            <th class="py-1.5 pr-2">Student</th>
                            <th class="py-1.5 pr-2">Cashier</th>
                            <th class="py-1.5 pr-2">Items</th>
                            <th class="py-1.5 pr-2">Units</th>
                            <th class="py-1.5 text-right">Total</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr
                            v-for="row in printRows"
                            :key="`print-${row.documentId}`"
                            class="border-b border-slate-300"
                        >
                            <td class="py-1.5 pr-2">
                                {{ row.receiptNumber || '—' }}
                            </td>
                            <td class="py-1.5 pr-2">
                                {{ formatDateTime(row.effectiveDate) }}
                            </td>
                            <td class="py-1.5 pr-2">
                                {{
                                    row.studentName ||
                                    row.studentIdNumber ||
                                    '—'
                                }}
                            </td>
                            <td class="py-1.5 pr-2">{{ row.cashier }}</td>
                            <td class="py-1.5 pr-2">
                                {{
                                    row.lines
                                        .map(
                                            (line) =>
                                                `${line.qtyPulled} × ${line.name}`
                                        )
                                        .join(', ') || '—'
                                }}
                            </td>
                            <td class="py-1.5 pr-2">
                                {{
                                    row.lines.reduce(
                                        (sum, line) => sum + line.qtyPulled,
                                        0
                                    )
                                }}
                            </td>
                            <td class="py-1.5 text-right">
                                {{ formatMoney(row.total) }}
                            </td>
                        </tr>

                        <tr v-if="!printRows.length">
                            <td
                                colspan="7"
                                class="py-3 text-center text-slate-500"
                            >
                                No completed sales in this period.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type {
    SalesReportCashierRow,
    SalesReportDetailRow,
    SalesReportItemRow,
} from '#shared/types/report'

definePageMeta({
    layout: 'admin',
})

const {
    periodMode,
    month,
    year,
    yearOptions,
    manualStart,
    manualEnd,
    appliedRange,
    search,
    sorting,
    pagination,
    page,
    pageSize,
    expandedRows,
    report,
    fetchError,
    pending,
    exportPending,
    printRows,
    printPending,
    applyPeriod,
    refresh,
    exportCsv,
    preparePrint,
} = useSalesReport()

const periodModes = [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
    { label: 'Manual', value: 'manual' },
] as const

const pageSizeOptions = [10, 20, 50]
const generatedAt = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
}).format(new Date())

const invalidRange = computed(
    () => periodMode.value === 'manual' && manualStart.value > manualEnd.value
)

const stats = computed(() => {
    const summary = report.value?.summary

    return [
        {
            label: 'Completed sales',
            value: summary?.sales ?? '—',
        },
        {
            label: 'Units sold',
            value: summary?.units ?? '—',
        },
        {
            label: 'Revenue',
            value: formatMoney(summary?.revenue),
        },
        {
            label: 'Average sale',
            value: formatMoney(summary?.averageSale),
        },
        {
            label: 'Students',
            value: summary?.students ?? '—',
        },
    ]
})

const maxBucketSales = computed(() =>
    Math.max(1, ...(report.value?.buckets.map((bucket) => bucket.sales) ?? []))
)

const itemColumns: TableColumn<SalesReportItemRow>[] = [
    {
        accessorKey: 'name',
        header: 'Item',
    },
    {
        accessorKey: 'units',
        header: 'Units',
    },
    {
        accessorKey: 'sales',
        header: 'Sales',
    },
    {
        accessorKey: 'revenue',
        header: 'Revenue',
    },
]

const detailColumns: TableColumn<SalesReportDetailRow>[] = [
    {
        id: 'expand',
        header: '',
        enableSorting: false,
        meta: {
            class: {
                td: 'w-10',
                th: 'w-10',
            },
        },
    },
    {
        accessorKey: 'receiptNumber',
        id: 'receipt',
        header: 'Receipt #',
    },
    {
        accessorKey: 'effectiveDate',
        id: 'date',
        header: 'Date',
    },
    {
        accessorKey: 'studentName',
        id: 'student',
        header: 'Student',
    },
    {
        accessorKey: 'cashier',
        header: 'Cashier',
    },
    {
        id: 'units',
        header: 'Units',
        enableSorting: false,
    },
    {
        accessorKey: 'total',
        header: 'Total',
    },
    {
        accessorKey: 'notes',
        header: 'Notes',
        enableSorting: false,
        meta: {
            class: {
                td: 'hidden xl:table-cell',
                th: 'hidden xl:table-cell',
            },
        },
    },
]
</script>

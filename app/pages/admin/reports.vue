<template>
    <div class="space-y-6">
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
                        Completed sales performance by period and item.
                    </p>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-3">
                <USelect
                    v-model="pdfOrientation"
                    :items="pdfOrientations"
                    size="lg"
                    class="w-36"
                    aria-label="PDF orientation"
                />

                <UButton
                    icon="i-lucide-file-text"
                    color="neutral"
                    variant="subtle"
                    size="lg"
                    :loading="pdfPending"
                    class="rounded-2xl"
                    @click="onExportPdf"
                >
                    Export PDF
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
                        <UIcon
                            name="i-lucide-chart-no-axes-combined"
                            class="size-5"
                        />
                    </div>

                    <div>
                        <h2
                            class="text-base font-semibold text-slate-900 dark:text-white"
                        >
                            Revenue Trend
                        </h2>

                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            Completed sales revenue per
                            {{
                                appliedRange.granularity === 'month'
                                    ? 'month'
                                    : 'day'
                            }}
                        </p>
                    </div>
                </div>

                <UChart
                    v-if="chartData.length"
                    type="line"
                    curve="monotone"
                    points
                    :data="chartData"
                    index="label"
                    :categories="[
                        { key: 'revenue', label: 'Revenue', color: '#059669' },
                    ]"
                    :format="formatCompactMoney"
                    :height="280"
                    y-label="Revenue (₱)"
                    aria-label="Revenue trend for the selected period"
                    class="w-full"
                />

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
                        placeholder="Search receipt, student, notes..."
                        size="lg"
                        class="w-full lg:w-80"
                    />
                </div>

                <UTable
                    v-model:sorting="sorting"
                    v-model:pagination="pagination"
                    :data="report.detail.rows"
                    :columns="detailColumns"
                    :loading="pending"
                    :pagination-options="{ manualPagination: true }"
                    :sorting-options="{ manualSorting: true }"
                    :empty="'No sales match your search.'"
                    class="flex-1"
                >
                    <template #items-cell="{ row }">
                        <span
                            class="block max-w-sm truncate text-sm text-slate-700 dark:text-slate-200"
                            :title="itemSummary(row.original)"
                        >
                            {{ itemSummary(row.original) }}
                        </span>
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

            <!-- Off-screen, fixed-width layout captured by html2canvas-pro -->
            <div
                ref="pdfReport"
                aria-hidden="true"
                class="pointer-events-none"
                :style="{
                    position: 'fixed',
                    left: '-10000px',
                    top: '0',
                    zIndex: -1,
                    width: pdfOrientation === 'portrait' ? '794px' : '1123px',
                    padding: '32px',
                    background: '#ffffff',
                    color: '#111827',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                }"
            >
                <div
                    style="display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 2px solid #111827; padding-bottom: 12px"
                >
                    <div>
                        <div style="font-size: 24px; font-weight: 700">
                            Sales Report
                        </div>
                        <div
                            style="font-size: 12px; color: #4b5563; margin-top: 4px"
                        >
                            School Property &amp; Inventory
                        </div>
                    </div>

                    <div
                        style="text-align: right; font-size: 12px; color: #374151"
                    >
                        <div style="font-size: 14px; font-weight: 700">
                            {{ appliedRange.label }}
                        </div>
                        <div>Generated {{ generatedAt }}</div>
                    </div>
                </div>

                <div
                    style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px"
                >
                    <div
                        v-for="stat in stats"
                        :key="`pdf-stat-${stat.label}`"
                        style="flex: 1 1 28%; min-width: 150px; border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px"
                    >
                        <div
                            style="font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em"
                        >
                            {{ stat.label }}
                        </div>
                        <div
                            style="font-size: 18px; font-weight: 700; margin-top: 4px"
                        >
                            {{ stat.value }}
                        </div>
                    </div>
                </div>

                <h2 style="font-size: 14px; font-weight: 700; margin: 22px 0 8px">
                    Revenue Trend
                </h2>

                <table
                    style="width: 100%; border-collapse: collapse; font-size: 10px"
                >
                    <tbody>
                        <tr
                            v-for="bucket in report.buckets"
                            :key="`pdf-bucket-${bucket.key}`"
                        >
                            <td style="padding: 3px 8px 3px 0; white-space: nowrap">
                                {{ bucket.label }}
                            </td>
                            <td style="padding: 3px 8px">
                                <div
                                    style="height: 8px; background: #e5e7eb; border-radius: 4px"
                                >
                                    <div
                                        :style="{
                                            height: '8px',
                                            background: '#059669',
                                            borderRadius: '4px',
                                            width: `${bucketRevenuePercent(bucket.revenue)}%`,
                                        }"
                                    />
                                </div>
                            </td>
                            <td
                                style="padding: 3px 0; text-align: right; white-space: nowrap"
                            >
                                {{ formatMoney(bucket.revenue) }}
                            </td>
                        </tr>

                        <tr v-if="!report.buckets.length">
                            <td colspan="3" style="padding: 8px 0; color: #6b7280">
                                No completed sales in this period.
                            </td>
                        </tr>
                    </tbody>
                </table>

                <h2 style="font-size: 14px; font-weight: 700; margin: 22px 0 8px">
                    Top Items
                </h2>

                <table
                    style="width: 100%; border-collapse: collapse; font-size: 10px"
                >
                    <thead>
                        <tr
                            style="border-bottom: 2px solid #111827; text-align: left"
                        >
                            <th style="padding: 5px 8px 5px 0">Item</th>
                            <th style="padding: 5px 8px; text-align: right">Units</th>
                            <th style="padding: 5px 8px; text-align: right">Sales</th>
                            <th style="padding: 5px 0; text-align: right">Revenue</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr
                            v-for="item in report.topItems"
                            :key="`pdf-item-${item.itemId}`"
                            style="border-bottom: 1px solid #d1d5db"
                        >
                            <td style="padding: 5px 8px 5px 0">
                                {{ item.name }}
                            </td>
                            <td style="padding: 5px 8px; text-align: right">
                                {{ item.units }}
                            </td>
                            <td style="padding: 5px 8px; text-align: right">
                                {{ item.sales }}
                            </td>
                            <td style="padding: 5px 0; text-align: right">
                                {{ formatMoney(item.revenue) }}
                            </td>
                        </tr>

                        <tr v-if="!report.topItems.length">
                            <td colspan="4" style="padding: 8px 0; color: #6b7280">
                                No items sold in this period.
                            </td>
                        </tr>
                    </tbody>
                </table>

                <h2 style="font-size: 14px; font-weight: 700; margin: 22px 0 8px">
                    Sale Details
                </h2>

                <table
                    style="width: 100%; border-collapse: collapse; font-size: 10px"
                >
                    <thead>
                        <tr
                            style="border-bottom: 2px solid #111827; text-align: left"
                        >
                            <th style="padding: 5px 8px 5px 0">Receipt</th>
                            <th style="padding: 5px 8px">Date</th>
                            <th style="padding: 5px 8px">Student</th>
                            <th style="padding: 5px 8px">Items</th>
                            <th style="padding: 5px 8px; text-align: right">Units</th>
                            <th style="padding: 5px 0; text-align: right">Total</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr
                            v-for="row in pdfRows"
                            :key="`pdf-row-${row.documentId}`"
                            style="border-bottom: 1px solid #d1d5db"
                        >
                            <td style="padding: 5px 8px 5px 0">
                                {{ row.receiptNumber || '—' }}
                            </td>
                            <td style="padding: 5px 8px; white-space: nowrap">
                                {{ formatDateTime(row.effectiveDate) }}
                            </td>
                            <td style="padding: 5px 8px">
                                {{
                                    row.studentName ||
                                    row.studentIdNumber ||
                                    '—'
                                }}
                            </td>
                            <td style="padding: 5px 8px; word-break: break-word">
                                {{ itemBreakdown(row) }}
                            </td>
                            <td style="padding: 5px 8px; text-align: right">
                                {{
                                    row.lines.reduce(
                                        (sum, line) => sum + line.qtyPulled,
                                        0
                                    )
                                }}
                            </td>
                            <td
                                style="padding: 5px 0; text-align: right; white-space: nowrap"
                            >
                                {{ formatMoney(row.total) }}
                            </td>
                        </tr>

                        <tr v-if="!pdfRows.length">
                            <td colspan="6" style="padding: 8px 0; color: #6b7280">
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
    SalesReportBucket,
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
    report,
    fetchError,
    pending,
    exportPending,
    pdfRows,
    pdfPending,
    pdfOrientation,
    applyPeriod,
    refresh,
    exportCsv,
    exportPdf,
} = useSalesReport()

const periodModes = [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
    { label: 'Manual', value: 'manual' },
] as const

const pageSizeOptions = [10, 20, 50]
const pdfOrientations = [
    { label: 'Landscape', value: 'landscape' },
    { label: 'Portrait', value: 'portrait' },
]

const pdfReport = ref<HTMLElement | null>(null)
const generatedAt = ref('')

function formatGeneratedAt(): string {
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date())
}
generatedAt.value = formatGeneratedAt()

async function onExportPdf() {
    generatedAt.value = formatGeneratedAt()
    await exportPdf(pdfReport.value)
}

const compactMoney = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    notation: 'compact',
    maximumFractionDigits: 1,
})

function formatCompactMoney(value: number): string {
    return compactMoney.format(value)
}

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

function shortBucketLabel(bucket: SalesReportBucket): string {
    const [year, month, day] = bucket.key.split('-').map(Number)
    if (!year || !month) {
        return bucket.label
    }

    const date = new Date(year, month - 1, day ?? 1)
    return new Intl.DateTimeFormat(
        'en-US',
        appliedRange.value.granularity === 'month'
            ? { month: 'short', year: '2-digit' }
            : { month: 'short', day: 'numeric' }
    ).format(date)
}

const chartData = computed(() =>
    (report.value?.buckets ?? []).map((bucket) => ({
        label: shortBucketLabel(bucket),
        revenue: bucket.revenue ?? 0,
    }))
)

const maxBucketRevenue = computed(() =>
    Math.max(
        1,
        ...(report.value?.buckets.map((bucket) => bucket.revenue ?? 0) ?? [])
    )
)

function bucketRevenuePercent(revenue: number | null): number {
    return Math.max(2, ((revenue ?? 0) / maxBucketRevenue.value) * 100)
}

function itemSummary(row: SalesReportDetailRow): string {
    return (
        row.lines
            .map((line) => `${line.qtyPulled} × ${line.name}`)
            .join(', ') || '—'
    )
}

function itemBreakdown(row: SalesReportDetailRow): string {
    return (
        row.lines
            .map(
                (line) =>
                    `${line.qtyPulled} × ${line.name} @ ${formatMoney(line.unitPrice)} = ${formatMoney(line.lineTotal)}`
            )
            .join('; ') || '—'
    )
}

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
        id: 'items',
        header: 'Items',
        enableSorting: false,
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

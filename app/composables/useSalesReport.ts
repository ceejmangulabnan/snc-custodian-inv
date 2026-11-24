import type { SortingState } from '@tanstack/vue-table'
import type {
    ReportRange,
    SalesReportDetailRow,
    SalesReportQuery,
    SalesReportResponse,
} from '#shared/types/report'

export type ReportPeriodMode = 'monthly' | 'yearly' | 'manual'
const MILLISECONDS_PER_DAY = 86_400_000

function toDateInput(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
}

function toMonthInput(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${date.getFullYear()}-${month}`
}

function parseDateInput(value: string, endOfDay: boolean): Date {
    const [year, month, day] = value.split('-').map(Number)
    if (!year || !month || !day) {
        const today = new Date()
        return endOfDay
            ? new Date(
                  today.getFullYear(),
                  today.getMonth(),
                  today.getDate(),
                  23,
                  59,
                  59,
                  999
              )
            : new Date(today.getFullYear(), today.getMonth(), today.getDate())
    }

    return endOfDay
        ? new Date(year, month - 1, day, 23, 59, 59, 999)
        : new Date(year, month - 1, day)
}

export function formatMoney(value: number | null | undefined): string {
    if (value == null) {
        return '—'
    }
    return '₱' + value.toFixed(2)
}

export function formatDateTime(iso: string | null | undefined): string {
    if (!iso || Number.isNaN(Date.parse(iso))) {
        return '—'
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(iso))
}

export function useSalesReport() {
    const strapi = useStrapi()
    const toast = useToast()
    const today = new Date()

    const periodMode = ref<ReportPeriodMode>('monthly')
    const month = ref(toMonthInput(today))
    const year = ref(today.getFullYear())
    const manualStart = ref(toDateInput(today))
    const manualEnd = ref(toDateInput(today))
    const yearOptions = Array.from(
        { length: 10 },
        (_, index) => today.getFullYear() - index
    )

    const search = ref('')
    const searchQuery = ref('')
    let searchTimer: ReturnType<typeof setTimeout> | null = null

    watch(search, () => {
        if (searchTimer) {
            clearTimeout(searchTimer)
        }
        searchTimer = setTimeout(() => {
            searchQuery.value = search.value.trim()
            pagination.value = { ...pagination.value, pageIndex: 0 }
        }, 300)
    })

    onUnmounted(() => {
        if (searchTimer) {
            clearTimeout(searchTimer)
        }
    })

    function computeRange(): ReportRange {
        const tzOffsetMinutes = -today.getTimezoneOffset()

        if (periodMode.value === 'yearly') {
            const selectedYear = year.value
            return {
                start: new Date(selectedYear, 0, 1).toISOString(),
                end: new Date(
                    selectedYear,
                    11,
                    31,
                    23,
                    59,
                    59,
                    999
                ).toISOString(),
                label: String(selectedYear),
                granularity: 'month',
                tzOffsetMinutes,
            }
        }

        if (periodMode.value === 'manual') {
            const start = parseDateInput(manualStart.value, false)
            const end = parseDateInput(manualEnd.value, true)
            const days = Math.round(
                (end.getTime() - start.getTime()) / MILLISECONDS_PER_DAY
            )

            return {
                start: start.toISOString(),
                end: end.toISOString(),
                label: `${toDateInput(start)} – ${toDateInput(end)}`,
                granularity: days > 62 ? 'month' : 'day',
                tzOffsetMinutes,
            }
        }

        const [selectedYear, selectedMonth] = month.value.split('-').map(Number)
        const startYear = selectedYear || today.getFullYear()
        const startMonth = selectedMonth || today.getMonth() + 1
        const start = new Date(startYear, startMonth - 1, 1)
        const end = new Date(startYear, startMonth, 0, 23, 59, 59, 999)

        return {
            start: start.toISOString(),
            end: end.toISOString(),
            label: new Intl.DateTimeFormat('en-US', {
                month: 'long',
                year: 'numeric',
            }).format(start),
            granularity: 'day',
            tzOffsetMinutes,
        }
    }

    const appliedRange = ref<ReportRange>(computeRange())
    const sorting = ref<SortingState>([])
    const pagination = ref({ pageIndex: 0, pageSize: 10 })
    const expandedRows = ref({})

    const page = computed({
        get: () => pagination.value.pageIndex + 1,
        set: (value: number) => {
            pagination.value = { ...pagination.value, pageIndex: value - 1 }
        },
    })

    const pageSize = computed({
        get: () => pagination.value.pageSize,
        set: (value: number) => {
            pagination.value = {
                ...pagination.value,
                pageSize: value,
                pageIndex: 0,
            }
        },
    })

    function buildQuery(exportAll = false): SalesReportQuery {
        const sort = sorting.value[0]
        const fields: Record<string, string> = {
            date: 'date',
            receipt: 'receipt',
            student: 'student',
            cashier: 'cashier',
            total: 'total',
        }

        return {
            ...appliedRange.value,
            page: page.value,
            pageSize: pageSize.value,
            search: searchQuery.value,
            sort: sort
                ? `${fields[sort.id] ?? 'date'}:${sort.desc ? 'desc' : 'asc'}`
                : 'date:desc',
            ...(exportAll ? { export: '1' as const } : {}),
        }
    }

    // A string key keeps useAsyncData in sync with nested pagination changes.
    const queryKey = computed(() => JSON.stringify(buildQuery()))

    const { data, error, pending, refresh } = useAsyncData(
        'salesReport',
        () =>
            strapi.get<SalesReportResponse>('/reports/sales', {
                ...buildQuery(),
            }),
        { watch: [queryKey] }
    )

    const report = computed(() => data.value ?? null)
    const fetchError = computed(() =>
        error.value
            ? (error.value as Error).message || 'Failed to load report'
            : ''
    )

    function applyPeriod() {
        appliedRange.value = computeRange()
        pagination.value = { ...pagination.value, pageIndex: 0 }
    }

    const exportPending = ref(false)

    async function exportCsv() {
        exportPending.value = true
        try {
            const response = await strapi.get<SalesReportResponse>(
                '/reports/sales',
                { ...buildQuery(true) }
            )
            const rows = response.detail.rows.map((row) => {
                const lines = row.lines
                    .map((line) => `${line.qtyPulled} × ${line.name}`)
                    .join('; ')

                return [
                    row.receiptNumber ?? '',
                    formatDateTime(row.effectiveDate),
                    row.studentName ?? '',
                    row.studentIdNumber ?? '',
                    row.cashier,
                    lines,
                    row.lines.reduce((sum, line) => sum + line.qtyPulled, 0),
                    row.total ?? '',
                    row.notes ?? '',
                ]
            })

            downloadCsv(
                `sales-report-${toDateInput(new Date(appliedRange.value.start))}-to-${toDateInput(new Date(appliedRange.value.end))}.csv`,
                [
                    'Receipt #',
                    'Purchase Date',
                    'Student',
                    'Student ID',
                    'Cashier',
                    'Items',
                    'Units',
                    'Total',
                    'Notes',
                ],
                rows
            )

            toast.add({
                title: 'Report exported',
                description: `${rows.length} sale${rows.length === 1 ? '' : 's'} written to CSV.`,
                color: 'success',
            })
        } catch (exportError) {
            toast.add({
                title: 'Could not export report',
                description:
                    (exportError as Error).message || 'Please try again.',
                color: 'error',
            })
        } finally {
            exportPending.value = false
        }
    }

    const printRows = ref<SalesReportDetailRow[]>([])
    const printPending = ref(false)

    async function preparePrint() {
        printPending.value = true
        try {
            // Printouts include every sale in the selected range, not just the
            // current detail-table page.
            const response = await strapi.get<SalesReportResponse>(
                '/reports/sales',
                { ...buildQuery(true) }
            )
            printRows.value = response.detail.rows
            await nextTick()
            window.print()
        } catch (printError) {
            toast.add({
                title: 'Could not prepare printout',
                description:
                    (printError as Error).message || 'Please try again.',
                color: 'error',
            })
        } finally {
            printPending.value = false
        }
    }

    return {
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
    }
}

import type { SortingState } from '@tanstack/vue-table'
import type {
    ReportRange,
    SalesReportDetailRow,
    SalesReportQuery,
    SalesReportResponse,
} from '#shared/types/report'

export type ReportPeriodMode = 'monthly' | 'yearly' | 'manual'
export type PdfOrientation = 'landscape' | 'portrait'
export type PdfExportMode = 'download' | 'preview'

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
                tzOffsetMinutes,
            }
        }

        if (periodMode.value === 'manual') {
            const start = parseDateInput(manualStart.value, false)
            const end = parseDateInput(manualEnd.value, true)

            return {
                start: start.toISOString(),
                end: end.toISOString(),
                label: `${toDateInput(start)} – ${toDateInput(end)}`,
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
            tzOffsetMinutes,
        }
    }

    // Period selectors are draft state; only applyPeriod promotes them to the
    // range used by the query, so editing them never triggers a fetch.
    const appliedRange = ref<ReportRange>(computeRange())
    const periodDirty = computed(
        () =>
            JSON.stringify(computeRange()) !==
            JSON.stringify(appliedRange.value)
    )
    const sorting = ref<SortingState>([])
    const pagination = ref({ pageIndex: 0, pageSize: 10 })

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
            start: appliedRange.value.start,
            end: appliedRange.value.end,
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

    const pdfRows = ref<SalesReportDetailRow[]>([])
    const pdfPending = ref(false)
    const pdfOrientation = ref<PdfOrientation>('portrait')

    async function exportPdf(
        element: HTMLElement | null,
        mode: PdfExportMode = 'download'
    ) {
        if (!element) {
            toast.add({
                title: 'Could not generate PDF',
                description: 'The report layout is not ready yet.',
                color: 'error',
            })
            return
        }

        // Open the tab synchronously so the browser does not block the popup
        // after the async fetch/capture work finishes.
        const previewWindow =
            mode === 'preview' ? window.open('', '_blank') : null
        if (mode === 'preview' && !previewWindow) {
            toast.add({
                title: 'Could not open preview',
                description: 'Allow pop-ups for this site and try again.',
                color: 'error',
            })
            return
        }

        pdfPending.value = true
        try {
            // Like CSV, the PDF includes every sale in the selected range,
            // not just the current detail-table page.
            const response = await strapi.get<SalesReportResponse>(
                '/reports/sales',
                { ...buildQuery(true) }
            )
            pdfRows.value = response.detail.rows
            await nextTick()

            // The report header includes the brand logo; wait for it so the
            // capture never paints a placeholder box.
            await Promise.all(
                Array.from(element.querySelectorAll('img')).map((image) =>
                    image.complete
                        ? Promise.resolve()
                        : new Promise<void>((resolve) => {
                              image.addEventListener('load', () => resolve(), {
                                  once: true,
                              })
                              image.addEventListener('error', () => resolve(), {
                                  once: true,
                              })
                          })
                )
            )

            const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
                import('html2canvas-pro'),
                import('jspdf'),
            ])

            // Cap the capture scale so long reports never exceed canvas limits.
            const scale = Math.min(
                2,
                30_000 / Math.max(element.scrollHeight, 1)
            )
            const canvas = await html2canvas(element, {
                scale,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                windowWidth: Math.max(element.scrollWidth, 800),
                windowHeight: element.scrollHeight,
            })

            const pdf = new jsPDF({
                orientation: pdfOrientation.value,
                unit: 'mm',
                format: 'a4',
                compress: true,
            })

            const margin = 8
            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()
            const contentWidth = pageWidth - margin * 2
            const contentHeight = pageHeight - margin * 2
            const fullHeight = (canvas.height * contentWidth) / canvas.width

            let offset = 0
            let pages = 0

            while (offset < fullHeight) {
                const sliceHeight = Math.min(contentHeight, fullHeight - offset)
                const sourceY = Math.round((offset / fullHeight) * canvas.height)
                const sourceHeight = Math.min(
                    canvas.height - sourceY,
                    Math.ceil((sliceHeight / fullHeight) * canvas.height)
                )

                const pageCanvas = document.createElement('canvas')
                pageCanvas.width = canvas.width
                pageCanvas.height = sourceHeight
                const context = pageCanvas.getContext('2d')
                if (!context) {
                    throw new Error('Canvas is not available')
                }

                context.fillStyle = '#ffffff'
                context.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
                context.drawImage(
                    canvas,
                    0,
                    sourceY,
                    canvas.width,
                    sourceHeight,
                    0,
                    0,
                    canvas.width,
                    sourceHeight
                )

                if (pages > 0) {
                    pdf.addPage()
                }

                pdf.addImage(
                    pageCanvas.toDataURL('image/jpeg', 0.92),
                    'JPEG',
                    margin,
                    margin,
                    contentWidth,
                    sliceHeight,
                    undefined,
                    'FAST'
                )

                offset += sliceHeight
                pages += 1
            }

            const filenameStart = toDateInput(new Date(appliedRange.value.start))
            const filenameEnd = toDateInput(new Date(appliedRange.value.end))
            const filename = `sales-report-${filenameStart}-to-${filenameEnd}.pdf`

            if (previewWindow) {
                const url = URL.createObjectURL(pdf.output('blob'))
                previewWindow.location.href = url
                previewWindow.focus()
                window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
            } else {
                pdf.save(filename)
            }

            toast.add({
                title: previewWindow ? 'PDF preview opened' : 'PDF generated',
                description: `${pages} page${pages === 1 ? '' : 's'} ${previewWindow ? 'ready' : 'saved'}.`,
                color: 'success',
            })
        } catch (pdfError) {
            previewWindow?.close()
            toast.add({
                title: 'Could not generate PDF',
                description:
                    (pdfError as Error).message || 'Please try again.',
                color: 'error',
            })
        } finally {
            pdfPending.value = false
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
        periodDirty,
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
    }
}

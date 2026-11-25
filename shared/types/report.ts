export interface ReportRange {
    start: string
    end: string
    label: string
    tzOffsetMinutes: number
}

export interface SalesReportQuery {
    start: string
    end: string
    page: number
    pageSize: number
    search: string
    sort: string
    export?: '1'
}

export interface SalesReportSummary {
    sales: number
    units: number
    revenue: number | null
    averageSale: number | null
    pricedSales: number
    students: number
    cashiers: number
}

export interface SalesReportItemRow {
    itemId: number
    name: string
    sku: string
    units: number
    sales: number
    revenue: number | null
}

export interface SalesReportCashierRow {
    id: number | null
    username: string
    sales: number
    units: number
    revenue: number | null
}

export interface SalesReportDetailLine {
    itemId: number
    name: string
    sku: string
    qtyPulled: number
    unitPrice: number | null
    lineTotal: number | null
}

export interface SalesReportDetailRow {
    id: number
    documentId: string
    receiptNumber: string | null
    purchaseDate: string | null
    effectiveDate: string
    studentName: string | null
    studentIdNumber: string | null
    cashierId: number | null
    cashier: string
    notes: string | null
    total: number | null
    lines: SalesReportDetailLine[]
}

export interface SalesReportPagination {
    page: number
    pageSize: number
    total: number
    pageCount: number
}

export interface SalesReportResponse {
    summary: SalesReportSummary
    topItems: SalesReportItemRow[]
    cashiers: SalesReportCashierRow[]
    detail: {
        rows: SalesReportDetailRow[]
        meta: SalesReportPagination
    }
}

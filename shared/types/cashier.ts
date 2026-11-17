export interface SaleItem {
    id: number
    name: string
    sku: string
    stockQty: number
    minThreshold: number
    unit: string
    price: number | null
}

export interface SaleTransaction {
    id: number
    documentId: string
    orderStatus: 'Pending' | 'Completed' | 'Voided'
    notes?: string | null
}

export interface ReceiptLine {
    itemId: number
    name: string
    qty: number
    lineTotal: number
}

export interface Receipt {
    id: number
    total: number
    notes?: string
    lines: ReceiptLine[]
}

export interface CartExposed {
    cartQty: (itemId: number) => number
    addToCart: (item: SaleItem) => void
}

export interface ItemListResponse {
    data: SaleItem[]
}

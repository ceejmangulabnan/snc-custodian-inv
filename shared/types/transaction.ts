export interface RecentTransaction {
    id: number
    createdAt: string
    orderStatus: 'Pending' | 'Completed' | 'Voided'
    custodian: {
        id: number
        username: string
    } | null
}

export interface TransactionItem {
    id: number
    qtyPulled: number
    item: {
        id: number
        name: string
        sku: string
    }
}

export interface RecentTransactionRow {
    id: number
    date: string
    createdAt?: string
    orderStatus: 'Pending' | 'Completed' | 'Voided'
    custodian: { id: number; username: string } | null
    receiptNumber?: string | null
    purchaseDate?: string | null
    studentName?: string | null
    studentIdNumber?: string | null
    notes?: string | null
    type?: string
    items?: TransactionItem[]
}

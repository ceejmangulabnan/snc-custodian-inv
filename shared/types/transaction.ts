export interface RecentTransaction {
    id: number
    createdAt: string
    orderStatus: 'Pending' | 'Completed' | 'Voided'
    custodian: {
        id: number
        username: string
    } | null
}

export interface RecentTransactionRow {
    id: number
    date: string
    custodian: string
    status: 'Pending' | 'Completed' | 'Voided'
}

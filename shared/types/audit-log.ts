export type AuditLogCategory =
    'Auth' | 'Inventory' | 'Transaction' | 'User' | 'System'

export type AuditLogAction =
    | 'Login'
    | 'Logout'
    | 'Item Created'
    | 'Item Updated'
    | 'Item Deleted'
    | 'Stock In'
    | 'Stock Out'
    | 'Threshold Reached'
    | 'Transaction Completed'
    | 'Transaction Voided'
    | 'User Created'
    | 'User Updated'
    | 'User Deleted'

export interface AuditLogEntry {
    id: number
    timestamp: string
    user: string
    action: AuditLogAction
    target: string
    category: AuditLogCategory
}

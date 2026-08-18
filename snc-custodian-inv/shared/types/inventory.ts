export interface InventoryItem {
    id: number
    sku: string
    name: string
    category: string
    stockQty: number
    minThreshold: number
    unit: string
    status: string
}

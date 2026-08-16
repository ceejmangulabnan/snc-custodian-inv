<template>
    <div class="space-y-6">
        <!-- Page header -->
        <div class="flex items-start gap-4">
            <div
                class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_10px_30px_rgba(245,158,11,0.35)]"
            >
                <UIcon name="i-lucide-clipboard-list" class="size-7" />
            </div>

            <div>
                <h1
                    class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
                >
                    Transactions
                </h1>

                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Review custodian requests, approve stock issues, or void
                    them.
                </p>
            </div>

            <div class="ml-auto">
                <UButton
                    color="success"
                    icon="i-lucide-shopping-cart"
                    size="lg"
                    @click="openIssue"
                >
                    Issue Stock
                </UButton>
            </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div
                v-for="stat in stats"
                :key="stat.label"
                class="group relative overflow-hidden rounded-3xl border border-green-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
                <div class="relative flex items-center justify-between">
                    <div>
                        <p
                            class="text-sm font-medium text-slate-500 dark:text-slate-400"
                        >
                            {{ stat.label }}
                        </p>

                        <p
                            class="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
                        >
                            {{ stat.value }}
                        </p>
                    </div>

                    <div
                        class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg"
                        :class="stat.tint"
                    >
                        <UIcon :name="stat.icon" class="size-6" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Fetch error -->
        <UAlert
            v-if="fetchError"
            color="error"
            variant="soft"
            icon="i-lucide-triangle-alert"
            :title="errorMessage"
            description="Check that the backend is running and try again."
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

        <!-- Transactions table -->
        <div
            v-else
            class="overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
            <!-- Table header -->
            <div
                class="flex flex-col gap-4 border-b border-green-100 p-5 lg:flex-row lg:items-center lg:justify-between dark:border-slate-700"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    >
                        <UIcon name="i-lucide-list" class="size-5" />
                    </div>

                    <div>
                        <h2
                            class="text-base font-semibold text-slate-900 dark:text-white"
                        >
                            Transaction History
                        </h2>

                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            {{ transactions.length }} of
                            {{ filteredTotal }} transactions shown
                        </p>
                    </div>
                </div>

                <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <UInput
                        v-model="search"
                        icon="i-lucide-search"
                        placeholder="Search item, notes..."
                        size="lg"
                        class="w-full sm:w-72"
                    />

                    <USelect
                        v-model="status"
                        :items="statusOptions"
                        size="lg"
                        class="w-full sm:w-56"
                    />
                </div>
            </div>

            <!-- Table -->
            <UTable
                :data="transactions"
                :columns="columns"
                :loading="pending"
                :pagination-options="{ manualPagination: true }"
                v-model:sorting="sorting"
                v-model:pagination="pagination"
                v-model:expanded="expandedRows"
                :empty="'No transactions match your filters.'"
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
                                v-for="line in findStrapiTransactionById(
                                    row.original.id
                                )?.items ?? []"
                                :key="line.id"
                                class="flex items-center gap-3 px-4 py-2.5"
                            >
                                <div
                                    class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400"
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
                                        {{ line.item?.name ?? 'Deleted item' }}
                                    </p>

                                    <p
                                        class="text-xs text-slate-500 dark:text-slate-400"
                                    >
                                        {{
                                            line.item?.sku ?? 'SKU unavailable'
                                        }}
                                    </p>
                                </div>

                                <span
                                    class="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-200"
                                >
                                    {{ line.qtyPulled }}
                                    {{ line.item?.unit ?? '' }}
                                </span>
                            </li>
                        </ul>
                    </div>
                </template>

                <template #date-cell="{ row }">
                    <span class="text-sm text-slate-700 dark:text-slate-200">
                        {{ formatDate(row.original.date) }}
                    </span>
                </template>

                <template #status-cell="{ row }">
                    <UBadge
                        :color="statusColor(row.original.status)"
                        variant="subtle"
                        :icon="statusIcon(row.original.status)"
                    >
                        {{ row.original.status }}
                    </UBadge>
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

                <template #actions-cell="{ row }">
                    <UDropdownMenu
                        :items="getTransactionActions(row.original.id)"
                        :ui="{
                            content: 'w-48',
                            itemLeadingIcon: 'size-4',
                        }"
                    >
                        <UButton
                            icon="i-lucide-ellipsis-vertical"
                            color="neutral"
                            variant="ghost"
                        />
                    </UDropdownMenu>
                </template>
            </UTable>

            <!-- Table footer -->
            <div
                class="flex flex-col gap-4 border-t border-green-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between dark:border-slate-700"
            >
                <p class="text-xs text-slate-500 dark:text-slate-400">
                    {{ pendingCount }} pending
                    <span class="text-slate-400 dark:text-slate-500">
                        · Last refreshed {{ lastRefreshed }}
                    </span>
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
                        :total="filteredTotal"
                        :items-per-page="pagination.pageSize"
                        :show-edges="true"
                        :show-controls="true"
                        size="sm"
                    />
                </div>
            </div>
        </div>

        <!-- Transaction details modal -->
        <UModal v-model:open="detailOpen" :ui="{ content: 'rounded-[28px]' }">
            <template #content>
                <div
                    class="relative flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-green-100 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90"
                >
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex items-start gap-4">
                            <div
                                class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-[0_10px_30px_rgba(245,158,11,0.35)]"
                            >
                                <UIcon
                                    name="i-lucide-clipboard-list"
                                    class="size-5"
                                />
                            </div>

                            <div>
                                <h2
                                    class="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                                >
                                    Transaction #{{ detailTransaction?.id }}
                                </h2>

                                <p
                                    class="mt-0.5 text-sm text-slate-500 dark:text-slate-400"
                                >
                                    Requested by
                                    {{
                                        detailTransaction?.custodian
                                            ?.username ?? 'Unknown'
                                    }}
                                    on
                                    {{
                                        detailTransaction
                                            ? formatDate(
                                                  detailTransaction.createdAt
                                              )
                                            : ''
                                    }}
                                </p>
                            </div>
                        </div>

                        <UBadge
                            v-if="detailTransaction"
                            :color="statusColor(detailTransaction.orderStatus)"
                            variant="subtle"
                            :icon="statusIcon(detailTransaction.orderStatus)"
                        >
                            {{ detailTransaction.orderStatus }}
                        </UBadge>
                    </div>

                    <div class="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
                        <p
                            v-if="detailTransaction?.notes"
                            class="mt-4 rounded-2xl border border-green-100 bg-green-50/60 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                        >
                            {{ detailTransaction.notes }}
                        </p>

                        <div class="mt-6">
                            <h3
                                class="text-sm font-semibold text-slate-700 dark:text-slate-200"
                            >
                                Line Items
                            </h3>

                            <ul
                                class="mt-3 divide-y divide-green-100 overflow-hidden rounded-2xl border border-green-100 dark:divide-slate-700 dark:border-slate-700"
                            >
                                <li
                                    v-for="line in detailTransaction?.items ??
                                    []"
                                    :key="line.id"
                                    class="flex items-center gap-3 px-4 py-3"
                                >
                                    <div
                                        class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"
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
                                            {{
                                                line.item?.name ??
                                                'Deleted item'
                                            }}
                                        </p>

                                        <p
                                            class="text-xs text-slate-500 dark:text-slate-400"
                                        >
                                            {{
                                                line.item?.sku ??
                                                'SKU unavailable'
                                            }}
                                        </p>
                                    </div>

                                    <span
                                        class="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-200"
                                    >
                                        {{ line.qtyPulled }}
                                        {{ line.item?.unit ?? '' }}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-6 flex shrink-0 justify-end">
                        <UButton
                            color="neutral"
                            variant="outline"
                            @click="detailOpen = false"
                        >
                            Close
                        </UButton>
                    </div>
                </div>
            </template>
        </UModal>

        <!-- Complete transaction modal -->
        <UModal v-model:open="completeOpen" :ui="{ content: 'rounded-[28px]' }">
            <template #content>
                <div
                    class="relative overflow-hidden rounded-[28px] border border-green-100 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90"
                >
                    <div class="flex items-start gap-4">
                        <div
                            class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-green-500 via-green-600 to-teal-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
                        >
                            <UIcon
                                name="i-lucide-circle-check"
                                class="size-5"
                            />
                        </div>

                        <div>
                            <h2
                                class="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                            >
                                Complete Transaction
                            </h2>

                            <p
                                class="mt-0.5 text-sm text-slate-500 dark:text-slate-400"
                            >
                                Issue the stock and mark transaction
                                <span
                                    class="font-medium text-slate-700 dark:text-slate-300"
                                >
                                    #{{ completeTarget?.id }}
                                </span>
                                as completed.
                            </p>
                        </div>
                    </div>

                    <ul
                        class="mt-6 divide-y divide-green-100 overflow-hidden rounded-2xl border border-green-100 dark:divide-slate-700 dark:border-slate-700"
                    >
                        <li
                            v-for="line in completeTarget?.items ?? []"
                            :key="line.id"
                            class="flex items-center gap-3 px-4 py-3"
                        >
                            <div class="min-w-0 flex-1">
                                <p
                                    class="truncate text-sm font-medium text-slate-800 dark:text-slate-200"
                                >
                                    {{ line.item?.name ?? 'Deleted item' }}
                                </p>

                                <p
                                    class="text-xs"
                                    :class="
                                        line.item &&
                                        line.qtyPulled > line.item.stockQty
                                            ? 'font-medium text-red-600 dark:text-red-400'
                                            : 'text-slate-500 dark:text-slate-400'
                                    "
                                >
                                    {{
                                        line.item
                                            ? `${line.item.stockQty} available`
                                            : 'item no longer exists'
                                    }}
                                </p>
                            </div>

                            <span
                                class="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-200"
                            >
                                {{ line.qtyPulled }} requested
                            </span>
                        </li>
                    </ul>

                    <UAlert
                        v-if="completeError"
                        color="error"
                        variant="soft"
                        icon="i-lucide-alert-circle"
                        :title="completeError"
                        class="mt-5"
                    />

                    <div class="mt-6 flex justify-end gap-3">
                        <UButton
                            color="neutral"
                            variant="outline"
                            @click="completeOpen = false"
                        >
                            Cancel
                        </UButton>

                        <UButton
                            color="success"
                            icon="i-lucide-check"
                            :loading="completing"
                            @click="confirmComplete"
                        >
                            Complete
                        </UButton>
                    </div>
                </div>
            </template>
        </UModal>

        <!-- Void transaction modal -->
        <UModal v-model:open="voidOpen" :ui="{ content: 'rounded-[28px]' }">
            <template #content>
                <div
                    class="relative overflow-hidden rounded-[28px] border border-red-100 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-red-900/50 dark:bg-slate-900/90"
                >
                    <div class="flex items-start gap-4">
                        <div
                            class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-red-500 via-red-600 to-rose-600 text-white shadow-[0_10px_30px_rgba(239,68,68,0.35)]"
                        >
                            <UIcon name="i-lucide-ban" class="size-5" />
                        </div>

                        <div>
                            <h2
                                class="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                            >
                                Void Transaction
                            </h2>

                            <p
                                class="mt-0.5 text-sm text-slate-500 dark:text-slate-400"
                            >
                                Void transaction
                                <span
                                    class="font-medium text-slate-700 dark:text-slate-300"
                                >
                                    #{{ voidTarget?.id }}
                                </span>
                                ? No stock will be issued. This cannot be
                                undone.
                            </p>
                        </div>
                    </div>

                    <UAlert
                        v-if="voidError"
                        color="error"
                        variant="soft"
                        icon="i-lucide-alert-circle"
                        :title="voidError"
                        class="mt-5"
                    />

                    <div class="mt-6 flex justify-end gap-3">
                        <UButton
                            color="neutral"
                            variant="outline"
                            @click="voidOpen = false"
                        >
                            Cancel
                        </UButton>

                        <UButton
                            color="error"
                            icon="i-lucide-ban"
                            :loading="voiding"
                            @click="confirmVoid"
                        >
                            Void
                        </UButton>
                    </div>
                </div>
            </template>
        </UModal>
        <!-- Issue stock modal -->
        <UModal v-model:open="issueOpen" :ui="{ content: 'rounded-[28px]' }">
            <template #content>
                <div
                    class="relative flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-green-100 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90"
                >
                    <div class="flex items-start gap-4">
                        <div
                            class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-green-500 via-emerald-600 to-teal-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
                        >
                            <UIcon
                                name="i-lucide-shopping-cart"
                                class="size-5"
                            />
                        </div>

                        <div>
                            <h2
                                class="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                            >
                                Issue Stock
                            </h2>

                            <p
                                class="mt-0.5 text-sm text-slate-500 dark:text-slate-400"
                            >
                                Add items and issue them now. Stock is deducted
                                on submission.
                            </p>
                        </div>
                    </div>

                    <UInput
                        v-model="issueSearch"
                        icon="i-lucide-search"
                        placeholder="Search items..."
                        class="mt-5"
                    />

                    <div
                        class="mt-3 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1"
                    >
                        <div class="space-y-2">
                            <p
                                v-if="loadingCatalog"
                                class="py-8 text-center text-sm text-slate-400 dark:text-slate-500"
                            >
                                Loading items...
                            </p>

                            <p
                                v-else-if="filteredIssueCatalog.length === 0"
                                class="py-8 text-center text-sm text-slate-400 dark:text-slate-500"
                            >
                                No items match your search.
                            </p>

                            <div
                                v-for="item in filteredIssueCatalog"
                                :key="item.id"
                                class="flex items-center gap-3 rounded-2xl border border-green-100 px-4 py-3 dark:border-slate-700"
                            >
                                <div class="min-w-0 flex-1">
                                    <p
                                        class="truncate text-sm font-medium text-slate-800 dark:text-slate-200"
                                    >
                                        {{ item.name }}
                                    </p>

                                    <p
                                        class="text-xs text-slate-500 dark:text-slate-400"
                                    >
                                        {{ item.sku }}
                                    </p>
                                </div>

                                <span
                                    class="shrink-0 text-xs"
                                    :class="
                                        item.stockQty <= 0
                                            ? 'font-medium text-red-600 dark:text-red-400'
                                            : 'text-slate-500 dark:text-slate-400'
                                    "
                                >
                                    {{ item.stockQty }}
                                    {{ item.unit }} available
                                </span>

                                <UButton
                                    icon="i-lucide-plus"
                                    color="success"
                                    variant="soft"
                                    size="sm"
                                    :disabled="
                                        item.stockQty <= 0 ||
                                        cartQty(item.id) >= item.stockQty
                                    "
                                    @click="addToCart(item)"
                                >
                                    Add
                                </UButton>
                            </div>
                        </div>

                        <div
                            v-if="cartLines.length"
                            class="overflow-hidden rounded-2xl border border-green-100 dark:border-slate-700"
                        >
                            <div
                                class="flex items-center justify-between border-b border-green-100 bg-green-50/60 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800/60"
                            >
                                <p
                                    class="text-xs font-semibold text-slate-700 dark:text-slate-200"
                                >
                                    Cart · {{ cartLines.length }} item{{
                                        cartLines.length === 1 ? '' : 's'
                                    }}
                                    · {{ cartTotalQty }} unit{{
                                        cartTotalQty === 1 ? '' : 's'
                                    }}
                                </p>

                                <UButton
                                    color="neutral"
                                    variant="ghost"
                                    size="xs"
                                    icon="i-lucide-trash-2"
                                    @click="clearCart"
                                >
                                    Clear
                                </UButton>
                            </div>

                            <ul
                                class="divide-y divide-green-100 dark:divide-slate-700"
                            >
                                <li
                                    v-for="line in cartLines"
                                    :key="line.itemId"
                                    class="flex items-center gap-3 px-4 py-2.5"
                                >
                                    <div class="min-w-0 flex-1">
                                        <p
                                            class="truncate text-sm font-medium text-slate-800 dark:text-slate-200"
                                        >
                                            {{ line.name }}
                                        </p>

                                        <p
                                            class="text-xs text-slate-500 dark:text-slate-400"
                                        >
                                            {{ line.unit }} · up to
                                            {{ line.stockQty }}
                                        </p>
                                    </div>

                                    <UInputNumber
                                        v-model="issueCart[line.itemId]"
                                        :min="1"
                                        :max="line.stockQty"
                                        :step="1"
                                        class="w-24 shrink-0"
                                    />

                                    <UButton
                                        icon="i-lucide-x"
                                        color="error"
                                        variant="ghost"
                                        size="sm"
                                        @click="removeFromCart(line.itemId)"
                                    />
                                </li>
                            </ul>
                        </div>

                        <div class="w-full">
                            <label
                                class="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300"
                            >
                                Notes (optional)
                            </label>

                            <UTextarea
                                class="w-full"
                                v-model="issueNotes"
                                placeholder="Who is this for, or what is it for?"
                                :rows="2"
                            />
                        </div>

                        <UAlert
                            v-if="issueError"
                            color="error"
                            variant="soft"
                            icon="i-lucide-alert-circle"
                            :title="issueError"
                        />
                    </div>

                    <div class="mt-6 flex shrink-0 justify-end gap-3">
                        <UButton
                            color="neutral"
                            variant="outline"
                            @click="issueOpen = false"
                        >
                            Cancel
                        </UButton>

                        <UButton
                            color="success"
                            icon="i-lucide-shopping-cart"
                            :loading="issuing"
                            :disabled="cartLines.length === 0"
                            @click="submitIssue"
                        >
                            Issue Stock
                        </UButton>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { DropdownMenuItem } from '#ui/types'
import type { SortingState, ExpandedState } from '@tanstack/vue-table'

definePageMeta({
    layout: 'admin',
    middleware: 'admin',
})

/*
|--------------------------------------------------------------------------
| Strapi data
|--------------------------------------------------------------------------
*/

interface StrapiTransactionItem {
    id: number
    qtyPulled: number
    item: {
        id: number
        name: string
        sku: string
        unit: string
        stockQty: number
    } | null
}

interface StrapiTransaction {
    id: number
    documentId: string
    orderStatus: 'Pending' | 'Completed' | 'Voided'
    notes?: string | null
    custodian: {
        id: number
        username: string
        email?: string
    } | null
    items: StrapiTransactionItem[]
    createdAt: string
}

interface TransactionRow {
    id: number
    date: string
    custodian: string
    itemCount: number
    totalQty: number
    status: 'Pending' | 'Completed' | 'Voided'
    notes: string
}

interface TransactionStats {
    total: number
    pending: number
    completed: number
    voided: number
}

interface TransactionListResponse {
    data: StrapiTransaction[]
    meta: {
        pagination: {
            page: number
            pageSize: number
            pageCount: number
            total: number
        }
    }
}

interface RequestableItem {
    id: number
    name: string
    sku: string
    stockQty: number
    unit: string
}

const strapi = useStrapi()
const toast = useToast()

/*
|--------------------------------------------------------------------------
| Filters
|--------------------------------------------------------------------------
*/

const search = ref('')
const searchQuery = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(search, () => {
    if (searchTimer) {
        clearTimeout(searchTimer)
    }
    searchTimer = setTimeout(() => {
        searchQuery.value = search.value.trim()
    }, 300)
})

onUnmounted(() => {
    if (searchTimer) {
        clearTimeout(searchTimer)
    }
})

const status = ref('all')
const sorting = ref<SortingState>([])
const expandedRows = ref<ExpandedState>({})

const pagination = ref({ pageIndex: 0, pageSize: 10 })

const page = computed({
    get: () => pagination.value.pageIndex + 1,
    set: (value: number) => {
        pagination.value = {
            ...pagination.value,
            pageIndex: value - 1,
        }
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

const pageSizeOptions = [
    { label: '5 per page', value: 5 },
    { label: '10 per page', value: 10 },
    { label: '20 per page', value: 20 },
    { label: '50 per page', value: 50 },
]

const statusOptions = computed(() => [
    { label: 'All Statuses', value: 'all' },
    ...(['Pending', 'Completed', 'Voided'] as const).map((item) => ({
        label: item,
        value: item,
    })),
])

function buildTransactionQuery(): Record<string, unknown> {
    const params: Record<string, unknown> = {
        'populate[custodian]': 'true',
        'populate[items][populate][item]': 'true',
        'pagination[page]': pagination.value.pageIndex + 1,
        'pagination[pageSize]': pagination.value.pageSize,
    }

    const query = searchQuery.value
    if (query) {
        params['filters[$or][0][items][item][name][$containsi]'] = query
        params['filters[$or][1][notes][$containsi]'] = query
    }

    if (status.value !== 'all') {
        params['filters[orderStatus][$eq]'] = status.value
    }

    if (sorting.value.length) {
        params.sort = sorting.value
            .map((s) => {
                const field = s.id === 'status' ? 'orderStatus' : s.id
                return `${field}${s.desc ? ':desc' : ''}`
            })
            .join(',')
    }

    return params
}

const {
    data: transactionsResponse,
    error: fetchError,
    pending,
    refresh,
} = await useAsyncData(
    'fetchTransactions',
    () =>
        strapi.get<TransactionListResponse>(
            '/transactions',
            buildTransactionQuery()
        ),
    {
        watch: [searchQuery, status, sorting, pagination],
    }
)

const { data: statsResponse, refresh: refreshStats } = await useAsyncData(
    'fetchTransactionsStats',
    () => strapi.get<TransactionStats>('/transactions-stats')
)

const transactions = computed<TransactionRow[]>(() =>
    (transactionsResponse.value?.data ?? []).map((transaction) => ({
        id: transaction.id,
        date: transaction.createdAt,
        custodian: transaction.custodian?.username ?? '—',
        itemCount: transaction.items.length,
        totalQty: transaction.items.reduce(
            (sum, line) => sum + line.qtyPulled,
            0
        ),
        status: transaction.orderStatus,
        notes: transaction.notes ?? '',
    }))
)

const findStrapiTransactionById = (id: number): StrapiTransaction | undefined =>
    (transactionsResponse.value?.data ?? []).find(
        (transaction) => transaction.id === id
    )

const filteredTotal = computed(
    () =>
        transactionsResponse.value?.meta.pagination.total ??
        transactions.value.length
)

const errorMessage = computed(() => {
    const err = fetchError.value as { data?: { statusMessage?: string } } | null
    return err?.data?.statusMessage ?? 'Failed to load transactions'
})

watch([searchQuery, status, sorting], () => {
    pagination.value = {
        ...pagination.value,
        pageIndex: 0,
    }
    expandedRows.value = {}
})

/*
|--------------------------------------------------------------------------
| Stats
|--------------------------------------------------------------------------
*/

const pendingCount = computed(() => statsResponse.value?.pending ?? 0)

const stats = computed(() => [
    {
        label: 'Total Transactions',
        value: statsResponse.value?.total ?? 0,
        icon: 'i-lucide-clipboard-list',
        tint: 'from-amber-500 to-orange-600',
    },
    {
        label: 'Pending',
        value: statsResponse.value?.pending ?? 0,
        icon: 'i-lucide-hourglass',
        tint: 'from-slate-500 to-slate-700',
    },
    {
        label: 'Completed',
        value: statsResponse.value?.completed ?? 0,
        icon: 'i-lucide-circle-check',
        tint: 'from-green-500 via-green-600 to-teal-600',
    },
    {
        label: 'Voided',
        value: statsResponse.value?.voided ?? 0,
        icon: 'i-lucide-ban',
        tint: 'from-red-500 to-rose-600',
    },
])

function formatRefreshTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
    }).format(date)
}

const lastRefreshed = ref(formatRefreshTime(new Date()))

watch(pending, (value) => {
    if (!value) {
        lastRefreshed.value = formatRefreshTime(new Date())
    }
})

/*
|--------------------------------------------------------------------------
| Table
|--------------------------------------------------------------------------
*/

const statusColor = (
    value: TransactionRow['status']
): 'neutral' | 'success' | 'error' => {
    if (value === 'Completed') return 'success'
    if (value === 'Voided') return 'error'
    return 'neutral'
}

const statusIcon = (value: TransactionRow['status']): string => {
    if (value === 'Completed') return 'i-lucide-circle-check'
    if (value === 'Voided') return 'i-lucide-ban'
    return 'i-lucide-hourglass'
}

function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(iso))
}

const columns: TableColumn<TransactionRow>[] = [
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
        accessorKey: 'id',
        header: 'ID',
        enableSorting: false,
    },
    {
        accessorKey: 'date',
        header: 'Date',
    },
    {
        accessorKey: 'custodian',
        header: 'Custodian',
        enableSorting: false,
    },
    {
        accessorKey: 'itemCount',
        header: 'Items',
        enableSorting: false,
    },
    {
        accessorKey: 'totalQty',
        header: 'Qty',
        enableSorting: false,
    },
    {
        id: 'status',
        header: 'Status',
    },
    {
        id: 'notes',
        header: 'Notes',
        enableSorting: false,
    },
    {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        meta: {
            class: {
                td: 'text-right pr-4',
                th: 'text-right pr-4',
            },
        },
    },
]

/*
|--------------------------------------------------------------------------
| Row actions
|--------------------------------------------------------------------------
*/

function getTransactionActions(id: number): DropdownMenuItem[] {
    const transaction = findStrapiTransactionById(id)
    if (!transaction) return []

    const items: DropdownMenuItem[] = [
        {
            label: 'View Details',
            icon: 'i-lucide-eye',
            class: 'flex gap-2 items-center',
            onSelect: () => openDetail(transaction),
        },
    ]

    if (transaction.orderStatus === 'Pending') {
        items.push(
            {
                label: 'Complete',
                icon: 'i-lucide-circle-check',
                color: 'success',
                class: 'flex gap-2 items-center',
                onSelect: () => openComplete(transaction),
            },
            {
                label: 'Void',
                icon: 'i-lucide-ban',
                color: 'error',
                class: 'flex gap-2 items-center',
                onSelect: () => openVoid(transaction),
            }
        )
    }

    return items
}

/*
|--------------------------------------------------------------------------
| Issue stock modal
|--------------------------------------------------------------------------
*/

const issueOpen = ref(false)
const issuing = ref(false)
const issueError = ref('')
const issueNotes = ref('')
const issueSearch = ref('')
const loadingCatalog = ref(false)
const issueCatalog = ref<RequestableItem[]>([])
const issueCart = ref<Record<number, number>>({})
const issueCartOrder = ref<number[]>([])

async function loadIssueCatalog() {
    loadingCatalog.value = true
    issueError.value = ''
    try {
        const response = await strapi.get<{ data: RequestableItem[] }>(
            '/items',
            {
                sort: 'name:asc',
                'pagination[pageSize]': 100,
                populate: 'category',
            }
        )
        issueCatalog.value = response.data
    } catch (err) {
        issueError.value =
            (err as Error).message ?? 'Failed to load items. Please try again.'
    } finally {
        loadingCatalog.value = false
    }
}

function openIssue() {
    issueOpen.value = true
    issueError.value = ''
    issueNotes.value = ''
    issueSearch.value = ''
    issueCart.value = {}
    issueCartOrder.value = []
    if (issueCatalog.value.length === 0) {
        loadIssueCatalog()
    }
}

const filteredIssueCatalog = computed(() => {
    const query = issueSearch.value.trim().toLowerCase()
    if (!query) return issueCatalog.value
    return issueCatalog.value.filter(
        (item) =>
            item.name.toLowerCase().includes(query) ||
            item.sku.toLowerCase().includes(query)
    )
})

function cartQty(itemId: number): number {
    return issueCart.value[itemId] ?? 0
}

function addToCart(item: RequestableItem) {
    const current = cartQty(item.id)
    if (current >= item.stockQty) return

    issueCart.value = {
        ...issueCart.value,
        [item.id]: current + 1,
    }
    if (current === 0) {
        issueCartOrder.value = [...issueCartOrder.value, item.id]
    }
}

function removeFromCart(itemId: number) {
    const next = { ...issueCart.value }
    delete next[itemId]
    issueCart.value = next
    issueCartOrder.value = issueCartOrder.value.filter((id) => id !== itemId)
}

function clearCart() {
    issueCart.value = {}
    issueCartOrder.value = []
}

const cartLines = computed(() => {
    const byId = new Map(issueCatalog.value.map((item) => [item.id, item]))

    return issueCartOrder.value
        .map((itemId) => byId.get(itemId))
        .filter((item): item is RequestableItem => item !== undefined)
        .map((item) => ({
            itemId: item.id,
            name: item.name,
            unit: item.unit,
            stockQty: item.stockQty,
            qty: Math.min(cartQty(item.id), item.stockQty),
        }))
        .filter((line) => line.qty > 0)
})

const cartTotalQty = computed(() =>
    cartLines.value.reduce((sum, line) => sum + line.qty, 0)
)

async function submitIssue() {
    if (issuing.value) return

    const lines = cartLines.value
    if (lines.length === 0) {
        issueError.value = 'Add at least one item to the cart.'
        return
    }

    for (const line of lines) {
        if (line.qty < 1 || line.qty > line.stockQty) {
            issueError.value = `Quantity for "${line.name}" must be between 1 and ${line.stockQty}.`
            return
        }
    }

    issuing.value = true
    issueError.value = ''

    try {
        await strapi.post('/transactions/issue', {
            items: lines.map((line) => ({
                item: line.itemId,
                qtyPulled: line.qty,
            })),
            notes: issueNotes.value.trim() || undefined,
        })
        issueOpen.value = false
        toast.add({
            title: 'Stock issued',
            description: `${cartTotalQty.value} unit(s) issued across ${lines.length} item(s).`,
        })
        await Promise.all([refresh(), refreshStats()])
    } catch (err) {
        issueError.value =
            (err as Error).message ?? 'Failed to issue stock. Please try again.'
    } finally {
        issuing.value = false
    }
}

/*
|--------------------------------------------------------------------------
| Details modal
|--------------------------------------------------------------------------
*/

const detailOpen = ref(false)
const detailTransaction = ref<StrapiTransaction | null>(null)

function openDetail(transaction: StrapiTransaction) {
    detailTransaction.value = transaction
    detailOpen.value = true
}

/*
|--------------------------------------------------------------------------
| Complete
|--------------------------------------------------------------------------
*/

const completeOpen = ref(false)
const completeTarget = ref<StrapiTransaction | null>(null)
const completing = ref(false)
const completeError = ref('')

function openComplete(transaction: StrapiTransaction) {
    completeTarget.value = transaction
    completeError.value = ''
    completeOpen.value = true
}

async function confirmComplete() {
    if (completing.value || !completeTarget.value) return

    const target = completeTarget.value
    completing.value = true
    completeError.value = ''

    try {
        await strapi.post(`/transactions/${target.documentId}/complete`)
        completeOpen.value = false
        toast.add({
            title: 'Transaction completed',
            description: `Stock issued for transaction #${target.id}`,
        })
        await Promise.all([refresh(), refreshStats()])
    } catch (err) {
        completeError.value =
            (err as Error).message ??
            'Failed to complete transaction. Please try again.'
    } finally {
        completing.value = false
    }
}

/*
|--------------------------------------------------------------------------
| Void
|--------------------------------------------------------------------------
*/

const voidOpen = ref(false)
const voidTarget = ref<StrapiTransaction | null>(null)
const voiding = ref(false)
const voidError = ref('')

function openVoid(transaction: StrapiTransaction) {
    voidTarget.value = transaction
    voidError.value = ''
    voidOpen.value = true
}

async function confirmVoid() {
    if (voiding.value || !voidTarget.value) return

    const target = voidTarget.value
    voiding.value = true
    voidError.value = ''

    try {
        await strapi.post(`/transactions/${target.documentId}/void`)
        voidOpen.value = false
        toast.add({
            title: 'Transaction voided',
            description: `Transaction #${target.id} was voided`,
        })
        await Promise.all([refresh(), refreshStats()])
    } catch (err) {
        voidError.value =
            (err as Error).message ??
            'Failed to void transaction. Please try again.'
    } finally {
        voiding.value = false
    }
}
</script>

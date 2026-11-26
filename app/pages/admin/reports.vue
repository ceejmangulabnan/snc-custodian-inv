<template>
    <div>
        <div class="mx-auto max-w-[1200px] space-y-6">
            <!-- Sticky report toolbar -->
            <div
                class="sticky top-[64px] z-30 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur print:hidden lg:top-[89px] dark:border-slate-700 dark:bg-slate-900/95"
            >
                <div
                    class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between"
                >
                    <div class="flex flex-wrap items-end gap-3">
                        <div>
                            <p
                                class="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400"
                            >
                                Period
                            </p>

                            <div
                                class="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800"
                            >
                                <UButton
                                    v-for="mode in periodModes"
                                    :key="mode.value"
                                    size="sm"
                                    :color="
                                        periodMode === mode.value
                                            ? 'primary'
                                            : 'neutral'
                                    "
                                    :variant="
                                        periodMode === mode.value
                                            ? 'solid'
                                            : 'ghost'
                                    "
                                    class="rounded-md px-3"
                                    @click="periodMode = mode.value"
                                >
                                    {{ mode.label }}
                                </UButton>
                            </div>
                        </div>

                        <div v-if="periodMode === 'monthly'">
                            <label
                                for="report-month"
                                class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400"
                            >
                                Month
                            </label>

                            <UInput
                                id="report-month"
                                v-model="month"
                                type="month"
                                size="sm"
                                class="w-40"
                            />
                        </div>

                        <div v-else-if="periodMode === 'yearly'">
                            <label
                                for="report-year"
                                class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400"
                            >
                                Year
                            </label>

                            <USelect
                                id="report-year"
                                v-model="year"
                                :items="yearOptions"
                                size="sm"
                                class="w-32"
                            />
                        </div>

                        <template v-else>
                            <div>
                                <label
                                    for="report-start"
                                    class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400"
                                >
                                    From
                                </label>

                                <UInput
                                    id="report-start"
                                    v-model="manualStart"
                                    type="date"
                                    size="sm"
                                    class="w-40"
                                />
                            </div>

                            <div>
                                <label
                                    for="report-end"
                                    class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400"
                                >
                                    To
                                </label>

                                <UInput
                                    id="report-end"
                                    v-model="manualEnd"
                                    type="date"
                                    size="sm"
                                    class="w-40"
                                />
                            </div>

                            <UButton
                                icon="i-lucide-check"
                                color="primary"
                                size="sm"
                                :disabled="invalidRange"
                                @click="applyPeriod"
                            >
                                Apply
                            </UButton>
                        </template>
                    </div>

                    <div class="flex flex-wrap items-end gap-2">
                        <div>
                            <p
                                class="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400"
                            >
                                Orientation
                            </p>

                            <USelect
                                v-model="pdfOrientation"
                                :items="pdfOrientations"
                                size="sm"
                                class="w-32"
                                aria-label="PDF orientation"
                            />
                        </div>

                        <UButton
                            icon="i-lucide-rotate-cw"
                            color="neutral"
                            variant="outline"
                            size="sm"
                            :loading="pending"
                            aria-label="Refresh report"
                            @click="refresh()"
                        />

                        <UButton
                            icon="i-lucide-download"
                            color="neutral"
                            variant="outline"
                            size="sm"
                            :loading="exportPending"
                            @click="exportCsv"
                        >
                            Export CSV
                        </UButton>

                        <UButton
                            icon="i-lucide-eye"
                            color="neutral"
                            variant="outline"
                            size="sm"
                            :loading="pdfPending"
                            @click="onPreviewReport"
                        >
                            Preview Report
                        </UButton>

                        <UButton
                            icon="i-lucide-file-text"
                            color="primary"
                            size="sm"
                            :loading="pdfPending"
                            @click="onExportPdf"
                        >
                            Export PDF
                        </UButton>
                    </div>
                </div>

                <div
                    class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400"
                >
                    <span>
                        Showing
                        <span
                            class="font-semibold text-slate-700 dark:text-slate-200"
                        >
                            {{ appliedRange.label }}
                        </span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                        Dates use purchase date when available, otherwise the
                        transaction date.
                    </span>
                    <span v-if="invalidRange" class="font-medium text-red-600">
                        The start date must be on or before the end date.
                    </span>
                </div>
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
                class="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            >
                <UIcon
                    name="i-lucide-loader-circle"
                    class="mr-2 size-5 animate-spin"
                />
                Building report…
            </div>

            <template v-else-if="report">
                <!-- Report identity -->
                <section
                    class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                    <div
                        class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"
                    >
                        <div class="flex items-start gap-4">
                            <div
                                class="flex size-16 shrink-0 items-center justify-center rounded-xl border border-slate-200 p-1 dark:border-slate-700"
                            >
                                <AppLogo :size="70" />
                            </div>

                            <div>
                                <h1
                                    class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
                                >
                                    Custodian Sales Report
                                </h1>
                                <p
                                    class="mt-1 text-xs text-slate-500 dark:text-slate-400"
                                >
                                    Completed sales performance by period and
                                    item.
                                </p>
                            </div>
                        </div>

                        <dl
                            class="grid w-full grid-cols-2 gap-x-6 gap-y-2 border-t border-slate-200 pt-4 text-xs lg:w-[340px] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 dark:border-slate-700"
                        >
                            <div>
                                <dt
                                    class="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400"
                                >
                                    Report ID
                                </dt>
                                <dd
                                    class="mt-0.5 font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-100"
                                >
                                    {{ reportId }}
                                </dd>
                            </div>
                            <div>
                                <dt
                                    class="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400"
                                >
                                    Generated Date
                                </dt>
                                <dd
                                    class="mt-0.5 font-mono tabular-nums text-slate-700 dark:text-slate-200"
                                >
                                    {{ generatedAt }}
                                </dd>
                            </div>
                            <div>
                                <dt
                                    class="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400"
                                >
                                    Reporting Period
                                </dt>
                                <dd
                                    class="mt-0.5 font-semibold text-slate-800 dark:text-slate-100"
                                >
                                    {{ appliedRange.label }}
                                </dd>
                            </div>
                            <div>
                                <dt
                                    class="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400"
                                >
                                    Prepared By
                                </dt>
                                <dd
                                    class="mt-0.5 border-b border-slate-300 pb-0.5 text-slate-400 dark:border-slate-600"
                                >
                                    ________________
                                </dd>
                            </div>
                        </dl>
                    </div>
                </section>

                <!-- KPI row -->
                <section>
                    <div
                        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                    >
                        <div
                            v-for="stat in stats"
                            :key="stat.label"
                            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                        >
                            <p
                                class="text-xs font-medium text-slate-500 dark:text-slate-400"
                            >
                                {{ stat.label }}
                            </p>

                            <p
                                class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
                                :class="
                                    stat.numeric ? 'font-mono tabular-nums' : ''
                                "
                            >
                                {{ stat.value }}
                            </p>

                            <p
                                v-if="stat.subtitle"
                                class="mt-1 text-xs text-slate-500 dark:text-slate-400"
                            >
                                {{ stat.subtitle }}
                            </p>
                        </div>
                    </div>
                </section>

                <!-- Report notes -->
                <section
                    class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                    <h2
                        class="text-base font-semibold text-slate-900 dark:text-white"
                    >
                        Report Notes
                    </h2>
                    <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Basis of preparation
                    </p>

                    <ul
                        class="mt-4 grid gap-3 text-xs leading-relaxed text-slate-600 sm:grid-cols-2 dark:text-slate-300"
                    >
                        <li class="flex gap-2">
                            <span aria-hidden="true">•</span>
                            <span>Completed sales only are included.</span>
                        </li>
                        <li class="flex gap-2">
                            <span aria-hidden="true">•</span>
                            <span>
                                Revenue uses the item price saved with each
                                sale.
                            </span>
                        </li>
                        <li class="flex gap-2">
                            <span aria-hidden="true">•</span>
                            <span>
                                Dates use purchase date when available,
                                otherwise the transaction date.
                            </span>
                        </li>
                        <li class="flex gap-2">
                            <span aria-hidden="true">•</span>
                            <span>
                                The exported report includes certification and
                                sign-off lines.
                            </span>
                        </li>
                    </ul>

                    <div
                        class="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700"
                    >
                        <p
                            class="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400"
                        >
                            Prepared By
                        </p>
                        <div
                            class="mt-2 h-6 border-b border-slate-300 dark:border-slate-600"
                        />
                    </div>
                </section>

                <!-- Sale details -->
                <section
                    class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                    <div
                        class="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700"
                    >
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

                        <UInput
                            v-model="search"
                            icon="i-lucide-search"
                            placeholder="Search receipt, student, notes..."
                            size="sm"
                            class="w-full sm:w-72"
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
                        class="ledger-table text-sm"
                    >
                        <template #receipt-cell="{ row }">
                            <span
                                class="whitespace-nowrap font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-100"
                            >
                                {{ row.original.receiptNumber || '—' }}
                            </span>
                        </template>

                        <template #date-cell="{ row }">
                            <span class="whitespace-nowrap">
                                {{ formatDateTime(row.original.effectiveDate) }}
                            </span>
                        </template>

                        <template #student-cell="{ row }">
                            <span class="whitespace-normal break-words">
                                {{
                                    row.original.studentName ||
                                    row.original.studentIdNumber ||
                                    '—'
                                }}
                            </span>
                        </template>

                        <template #items-cell="{ row }">
                            <span class="block max-w-sm whitespace-normal break-words">
                                {{ itemSummary(row.original) }}
                            </span>
                        </template>

                        <template #units-cell="{ row }">
                            <span class="whitespace-nowrap font-mono tabular-nums">
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
                                class="whitespace-nowrap font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-100"
                            >
                                {{ formatMoney(row.original.total) }}
                            </span>
                        </template>

                        <template #notes-cell="{ row }">
                            <span
                                class="block max-w-[10rem] truncate"
                                :title="row.original.notes || ''"
                                :class="
                                    row.original.notes
                                        ? 'text-slate-600 dark:text-slate-300'
                                        : 'text-slate-400 dark:text-slate-500'
                                "
                            >
                                {{ row.original.notes || '—' }}
                            </span>
                        </template>

                        <template #receipt-footer>
                            <span
                                class="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-300"
                            >
                                Page subtotal
                            </span>
                        </template>

                        <template #units-footer>
                            <span class="font-mono font-semibold tabular-nums">
                                {{ visibleUnits }}
                            </span>
                        </template>

                        <template #total-footer>
                            <span
                                class="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-100"
                            >
                                {{ formatMoney(visibleTotal) }}
                            </span>
                        </template>
                    </UTable>

                    <div
                        class="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700"
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
                </section>
            </template>
        </div>

        <!-- Off-screen, fixed-width layout captured by html2canvas-pro -->
        <div
            v-if="report"
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
                color: '#1f2937',
                fontFamily: 'Arial, Helvetica, sans-serif',
            }"
        >
            <div
                style="
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    border-bottom: 2px solid #142b47;
                    padding-bottom: 14px;
                "
            >
                <div>
                    <div style="display: flex; align-items: center; gap: 10px">
                        <img
                            src="/logo.png"
                            alt=""
                            style="
                                width: 36px;
                                height: 36px;
                                object-fit: contain;
                            "
                        />
                        <div>
                            <div
                                style="
                                    font-size: 11px;
                                    font-weight: 700;
                                    letter-spacing: 0.12em;
                                    color: #142b47;
                                "
                            >
                                SNC CUSTODIAN SYSTEM
                            </div>
                            <div
                                style="
                                    font-size: 10px;
                                    color: #6b7280;
                                    margin-top: 2px;
                                "
                            >
                                School Property &amp; Inventory
                            </div>
                        </div>
                    </div>
                    <div
                        style="
                            font-size: 20px;
                            font-weight: 700;
                            color: #142b47;
                            margin-top: 10px;
                        "
                    >
                        Custodian Sales Report
                    </div>
                </div>

                <div
                    style="
                        display: grid;
                        grid-template-columns: auto auto;
                        gap: 4px 16px;
                        font-size: 9px;
                        color: #374151;
                    "
                >
                    <div style="color: #6b7280; text-transform: uppercase">
                        Report ID
                    </div>
                    <div style="font-weight: 700; color: #142b47">
                        {{ reportId }}
                    </div>
                    <div style="color: #6b7280; text-transform: uppercase">
                        Generated
                    </div>
                    <div>{{ generatedAt }}</div>
                    <div style="color: #6b7280; text-transform: uppercase">
                        Period
                    </div>
                    <div style="font-weight: 700">{{ appliedRange.label }}</div>
                    <div style="color: #6b7280; text-transform: uppercase">
                        Prepared By
                    </div>
                    <div
                        style="
                            border-bottom: 1px solid #6b7280;
                            min-width: 90px;
                        "
                    >
                        &nbsp;
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 18px">
                <div
                    v-for="stat in stats"
                    :key="`pdf-stat-${stat.label}`"
                    style="
                        flex: 1;
                        border: 1px solid #cbd5e1;
                        background: #f8fafc;
                        padding: 8px 10px;
                    "
                >
                    <div
                        style="
                            font-size: 8px;
                            color: #6b7280;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                        "
                    >
                        {{ stat.label }}
                    </div>
                    <div
                        style="
                            font-size: 15px;
                            font-weight: 700;
                            color: #142b47;
                            margin-top: 4px;
                            font-variant-numeric: tabular-nums;
                        "
                    >
                        {{ stat.value }}
                    </div>
                    <div
                        v-if="stat.subtitle"
                        style="font-size: 8px; color: #6b7280; margin-top: 2px"
                    >
                        {{ stat.subtitle }}
                    </div>
                </div>
            </div>

            <h2
                style="
                    font-size: 12px;
                    font-weight: 700;
                    color: #142b47;
                    margin: 20px 0 6px;
                "
            >
                Sale Details
            </h2>
            <table
                style="width: 100%; border-collapse: collapse; font-size: 9px"
            >
                <thead>
                    <tr
                        style="
                            border-bottom: 2px solid #142b47;
                            text-align: left;
                        "
                    >
                        <th style="padding: 5px 6px 5px 0">Receipt #</th>
                        <th style="padding: 5px 6px">Date</th>
                        <th style="padding: 5px 6px">Student</th>
                        <th style="padding: 5px 6px">Items</th>
                        <th style="padding: 5px 6px; text-align: right">
                            Units
                        </th>
                        <th style="padding: 5px 6px; text-align: right">
                            Total
                        </th>
                        <th style="padding: 5px 0; width: 90px">Notes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="row in pdfRows"
                        :key="`pdf-row-${row.documentId}`"
                        style="border-bottom: 1px solid #d1d5db"
                    >
                        <td
                            style="
                                padding: 5px 6px 5px 0;
                                white-space: nowrap;
                                font-variant-numeric: tabular-nums;
                            "
                        >
                            {{ row.receiptNumber || '—' }}
                        </td>
                        <td style="padding: 5px 6px; white-space: nowrap">
                            {{ formatDateTime(row.effectiveDate) }}
                        </td>
                        <td style="padding: 5px 6px">
                            {{ row.studentName || row.studentIdNumber || '—' }}
                        </td>
                        <td style="padding: 5px 6px; word-break: break-word">
                            {{ itemBreakdown(row) }}
                        </td>
                        <td
                            style="
                                padding: 5px 6px;
                                text-align: right;
                                white-space: nowrap;
                                font-variant-numeric: tabular-nums;
                            "
                        >
                            {{
                                row.lines.reduce(
                                    (sum, line) => sum + line.qtyPulled,
                                    0
                                )
                            }}
                        </td>
                        <td
                            style="
                                padding: 5px 6px;
                                text-align: right;
                                white-space: nowrap;
                                font-variant-numeric: tabular-nums;
                            "
                        >
                            {{ formatMoney(row.total) }}
                        </td>
                        <td
                            style="
                                padding: 5px 0;
                                max-width: 90px;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                white-space: nowrap;
                            "
                        >
                            {{ row.notes || '—' }}
                        </td>
                    </tr>
                    <tr v-if="!pdfRows.length">
                        <td colspan="7" style="padding: 8px 0; color: #6b7280">
                            No completed sales in this period.
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr style="border-top: 2px solid #142b47">
                        <td
                            colspan="4"
                            style="
                                padding: 6px 6px 6px 0;
                                font-size: 8px;
                                font-weight: 700;
                                text-transform: uppercase;
                                color: #142b47;
                            "
                        >
                            Report total
                        </td>
                        <td
                            style="
                                padding: 6px;
                                text-align: right;
                                font-weight: 700;
                                font-variant-numeric: tabular-nums;
                            "
                        >
                            {{ pdfUnits }}
                        </td>
                        <td
                            style="
                                padding: 6px 6px 6px 0;
                                text-align: right;
                                font-weight: 700;
                                white-space: nowrap;
                                color: #142b47;
                                font-variant-numeric: tabular-nums;
                            "
                        >
                            {{ formatMoney(pdfTotal) }}
                        </td>
                        <td style="padding: 6px 0" />
                    </tr>
                </tfoot>
            </table>

            <div
                style="
                    border-top: 2px solid #142b47;
                    margin-top: 20px;
                    padding-top: 12px;
                "
            >
                <p style="font-size: 9px; line-height: 1.5; color: #374151">
                    <strong style="color: #142b47"
                        >CUSTODIAN CERTIFICATION.</strong
                    >
                    This is to certify that the entries in this Custodian Sales
                    Report were recorded from completed sales for the stated
                    reporting period and reflect the inventory items,
                    quantities, and amounts on file with the Property Custodian.
                </p>
                <div style="display: flex; gap: 24px; margin-top: 28px">
                    <div style="flex: 1">
                        <div
                            style="
                                height: 24px;
                                border-bottom: 1px solid #6b7280;
                            "
                        />
                        <div style="font-size: 8px; margin-top: 4px">
                            Prepared by: Property Custodian
                        </div>
                    </div>
                    <div style="flex: 1">
                        <div
                            style="
                                height: 24px;
                                border-bottom: 1px solid #6b7280;
                            "
                        />
                        <div style="font-size: 8px; margin-top: 4px">
                            Verified by: Finance / Administrator
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { SalesReportDetailRow } from '#shared/types/report'

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
    { label: 'Portrait', value: 'portrait' },
    { label: 'Landscape', value: 'landscape' },
]

const pdfReport = ref<HTMLElement | null>(null)
const generatedAt = ref('—')

function formatGeneratedAt(): string {
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date())
}

onMounted(() => {
    generatedAt.value = formatGeneratedAt()
})

async function onExportPdf() {
    generatedAt.value = formatGeneratedAt()
    await exportPdf(pdfReport.value)
}

async function onPreviewReport() {
    generatedAt.value = formatGeneratedAt()
    await exportPdf(pdfReport.value, 'preview')
}

const invalidRange = computed(
    () => periodMode.value === 'manual' && manualStart.value > manualEnd.value
)

function reportDateKey(iso: string, tzOffsetMinutes: number): string {
    const local = new Date(Date.parse(iso) + tzOffsetMinutes * 60_000)
    return local.toISOString().slice(0, 10).replace(/-/g, '')
}

const reportId = computed(() => {
    const range = appliedRange.value
    return `CSR-${reportDateKey(range.start, range.tzOffsetMinutes)}-${reportDateKey(range.end, range.tzOffsetMinutes)}`
})

const stats = computed(() => {
    const summary = report.value?.summary
    const students = summary?.students ?? 0

    return [
        {
            label: 'Completed Sales',
            value: summary?.sales ?? '—',
            subtitle: `${students} student${students === 1 ? '' : 's'}`,
            numeric: false,
        },
        {
            label: 'Units Sold',
            value: summary?.units ?? '—',
            subtitle: '',
            numeric: true,
        },
        {
            label: 'Gross Revenue (₱)',
            value: formatMoney(summary?.revenue),
            subtitle: '',
            numeric: true,
        },
        {
            label: 'Average Sale (₱)',
            value: formatMoney(summary?.averageSale),
            subtitle: '',
            numeric: true,
        },
    ]
})

const visibleRows = computed(() => report.value?.detail.rows ?? [])
const visibleUnits = computed(() =>
    visibleRows.value.reduce(
        (sum, row) =>
            sum +
            row.lines.reduce((lineSum, line) => lineSum + line.qtyPulled, 0),
        0
    )
)
const visibleTotal = computed(() =>
    visibleRows.value.reduce((sum, row) => sum + (row.total ?? 0), 0)
)

const pdfUnits = computed(() =>
    pdfRows.value.reduce(
        (sum, row) =>
            sum +
            row.lines.reduce((lineSum, line) => lineSum + line.qtyPulled, 0),
        0
    )
)
const pdfTotal = computed(() =>
    pdfRows.value.reduce((sum, row) => sum + (row.total ?? 0), 0)
)

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

const detailColumns: TableColumn<SalesReportDetailRow>[] = [
    {
        accessorKey: 'receiptNumber',
        id: 'receipt',
        header: 'Receipt #',
        footer: '',
        meta: {
            class: {
                th: 'whitespace-nowrap',
                td: 'whitespace-nowrap',
            },
        },
    },
    {
        accessorKey: 'effectiveDate',
        id: 'date',
        header: 'Date',
        meta: {
            class: {
                th: 'whitespace-nowrap',
                td: 'whitespace-nowrap',
            },
        },
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
        footer: '',
        meta: {
            class: {
                th: 'text-right whitespace-nowrap',
                td: 'text-right whitespace-nowrap',
            },
        },
    },
    {
        accessorKey: 'total',
        header: 'Total',
        footer: '',
        meta: {
            class: {
                th: 'text-right whitespace-nowrap',
                td: 'text-right whitespace-nowrap',
            },
        },
    },
    {
        accessorKey: 'notes',
        header: 'Notes',
        enableSorting: false,
        meta: {
            class: {
                td: 'hidden xl:table-cell whitespace-nowrap',
                th: 'hidden xl:table-cell whitespace-nowrap',
            },
        },
    },
]
</script>

<style scoped>
.ledger-table :deep([data-slot='thead'] th) {
    background: #f8fafc;
    border-bottom: 1px solid #cbd5e1;
    color: #334155;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}

.ledger-table :deep([data-slot='tbody'] td) {
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
}

.ledger-table :deep([data-slot='tr']:last-child td) {
    border-bottom: 0;
}

.ledger-table :deep([data-slot='tfoot'] th) {
    background: #f8fafc;
    border-top: 1px solid #cbd5e1;
    color: #334155;
}
</style>

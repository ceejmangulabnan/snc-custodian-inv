type CsvValue = string | number | null | undefined

function escapeCsv(value: CsvValue): string {
    if (value == null) {
        return ''
    }

    const text = String(value)
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function buildCsv(
    headers: string[],
    rows: CsvValue[][]
): string {
    const lines = [headers, ...rows].map((row) =>
        row.map(escapeCsv).join(',')
    )
    // BOM keeps Excel from mangling the peso sign and other UTF-8 characters.
    return `\uFEFF${lines.join('\r\n')}`
}

export function downloadCsv(
    filename: string,
    headers: string[],
    rows: CsvValue[][]
): void {
    const blob = new Blob([buildCsv(headers, rows)], {
        type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadCsv } from '@/lib/csvExport'

interface ExportCsvButtonProps {
  filename: string
  headers: string[]
  rows: unknown[][]
  label?: string
}

export default function ExportCsvButton({ filename, headers, rows, label = 'Export CSV' }: ExportCsvButtonProps) {
  return (
    <Button variant="outline" onClick={() => downloadCsv(filename, headers, rows)} disabled={rows.length === 0}>
      <Download /> {label}
    </Button>
  )
}

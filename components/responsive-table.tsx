"use client"
import { Card, CardContent } from "@/components/ui/card"
import { useMediaQuery } from "@/hooks/use-media-query"

interface TableData {
  headers: string[]
  rows: string[][]
}

interface ResponsiveTableProps {
  data: TableData
  className?: string
}

export default function ResponsiveTable({ data, className = "" }: ResponsiveTableProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <div className={`overflow-x-auto rounded-lg border ${className}`}>
        <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {data.headers.map((header, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? "" : "bg-gray-50 dark:bg-gray-800"}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-6 py-4 whitespace-normal text-sm text-center text-gray-900 dark:text-gray-100"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {data.rows.map((row, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-primary text-primary-foreground p-3 font-medium text-center">{row[0]}</div>
            <div className="p-4 space-y-2">
              {data.headers.slice(1).map((header, headerIndex) => (
                <div key={headerIndex} className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{header}</span>
                  <span className="text-gray-900 dark:text-gray-100">{row[headerIndex + 1]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

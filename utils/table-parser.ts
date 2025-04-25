export interface TableData {
  headers: string[]
  rows: string[][]
}

export function parseMarkdownTable(markdownTable: string): TableData {
  const lines = markdownTable.trim().split("\n")

  // 헤더 추출
  const headerLine = lines[0]
  const headers = headerLine
    .split("|")
    .filter((cell) => cell.trim() !== "")
    .map((cell) => cell.trim())

  // 구분선 건너뛰기 (두 번째 줄)

  // 데이터 행 추출
  const rows = lines
    .slice(2)
    .filter((line) => line.trim() !== "")
    .map((line) =>
      line
        .split("|")
        .filter((cell) => cell.trim() !== "")
        .map((cell) => cell.trim()),
    )

  return { headers, rows }
}

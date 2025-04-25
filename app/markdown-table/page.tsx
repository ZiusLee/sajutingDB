import MarkdownTableViewer from "@/components/markdown-table-viewer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function MarkdownTablePage() {
  return (
    <div className="container mx-auto py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">마크다운 테이블 뷰어</CardTitle>
        </CardHeader>
        <CardContent>
          <MarkdownTableViewer />
        </CardContent>
      </Card>
    </div>
  )
}

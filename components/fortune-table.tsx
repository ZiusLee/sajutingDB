"use client"

import ResponsiveTable from "./responsive-table"

export default function FortuneTable() {
  // 재물운 데이터
  const fortuneData = {
    headers: ["기간", "재물운 흐름", "특징"],
    rows: [
      ["1~3월", "평이함", "지출/수입 큰 변화 없음, 예산 관리에 집중"],
      ["4~6월", "점진적 상승", "부수입, 프로젝트 수익, 투잡 등 기회↑"],
      ["7~9월", "최고조", "투자나 금전 기회 활발, 작은 모험도 긍정적 결과 기대"],
      ["10~12월", "조심 필요", "무리한 지출·투자 주의. 재정 점검 추천"],
    ],
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">2024년 재물운 흐름</h2>
      <ResponsiveTable data={fortuneData} />
    </div>
  )
}

"use client"

import { Card, CardContent } from "@/components/ui/card"

interface FortuneWeatherCardProps {
  fortune: {
    type: string
    title: string
    weather: string
    description: string
    icon: any
    color: string
    score: number
  }
}

export default function FortuneWeatherCard({ fortune }: FortuneWeatherCardProps) {
  const getWeatherIcon = (score: number) => {
    if (score >= 80) return "☀️"
    if (score >= 60) return "⛅"
    if (score >= 40) return "☁️"
    return "🌧️"
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <fortune.icon className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-gray-900 dark:text-white">{fortune.title}</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl">{getWeatherIcon(fortune.score)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{fortune.weather}</div>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{fortune.description}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${fortune.score}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{fortune.score}%</span>
        </div>
      </CardContent>
    </Card>
  )
}

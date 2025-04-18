"use client"

import type React from "react"

import { useState } from "react"

interface Tab {
  id: string
  title: string
  content: React.ReactNode
}

interface MobileTabViewProps {
  tabs: Tab[]
}

export default function MobileTabView({ tabs }: MobileTabViewProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "")

  return (
    <div className="w-full">
      <div className="flex space-x-1 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap
              ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }
            `}
          >
            {tab.title}
          </button>
        ))}
      </div>

      <div className="mt-2">
        {tabs.map((tab) => (
          <div key={tab.id} className={activeTab === tab.id ? "block" : "hidden"}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}

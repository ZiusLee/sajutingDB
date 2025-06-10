"use client"

import { useState } from "react"
import { Heart, X } from "lucide-react"

interface CompatibilityTag {
  id: string
  mainPerson: string
  partners: string[]
  isAnalyzing: boolean
}

interface CompatibilityTagProps {
  tag: CompatibilityTag
  onRemove: (tagId: string) => void
  onClick?: () => void
}

export function CompatibilityTagComponent({ tag, onRemove, onClick }: CompatibilityTagProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm border transition-all duration-200 cursor-pointer ${
        tag.isAnalyzing
          ? "bg-purple-600/20 border-purple-500/50 text-purple-300"
          : "bg-blue-600/20 border-blue-500/50 text-blue-300 hover:bg-blue-600/30"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="flex items-center space-x-1">
        {tag.isAnalyzing ? (
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div
              className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        ) : (
          <Heart className="h-3 w-3" />
        )}
        <span className="font-medium">{tag.isAnalyzing ? "궁합 분석 중..." : "궁합 보기"}</span>
      </div>

      <div className="text-xs opacity-80">
        {tag.mainPerson} ↔{" "}
        {tag.partners.length > 1 ? `${tag.partners[0]} 외 ${tag.partners.length - 1}명` : tag.partners[0]}
      </div>

      {!tag.isAnalyzing && isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(tag.id)
          }}
          className="ml-1 hover:bg-blue-600/30 rounded-full p-0.5 transition-colors"
          title="태그 제거"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

interface CompatibilityTagsBarProps {
  tags: CompatibilityTag[]
  onRemoveTag: (tagId: string) => void
  onTagClick?: (tagId: string) => void
}

export function CompatibilityTagsBar({ tags, onRemoveTag, onTagClick }: CompatibilityTagsBarProps) {
  if (tags.length === 0) return null

  return (
    <div className="flex-shrink-0 bg-gray-800/95 border-b border-gray-700 px-3 md:px-4 py-2">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <CompatibilityTagComponent
              key={tag.id}
              tag={tag}
              onRemove={onRemoveTag}
              onClick={() => onTagClick?.(tag.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

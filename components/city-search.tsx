"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Check, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { type CityTimezoneData, CITY_TIMEZONE_DATA, DEFAULT_CITY_ID, searchCities } from "@/lib/city-timezone-data"

interface CitySearchProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function CitySearch({ value, onChange, disabled = false }: CitySearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [cities, setCities] = useState<CityTimezoneData[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // 선택된 도시 정보 가져오기
  const selectedCity =
    CITY_TIMEZONE_DATA.find((city) => city.id === value) ||
    CITY_TIMEZONE_DATA.find((city) => city.id === DEFAULT_CITY_ID)

  // 검색어에 따라 도시 목록 필터링
  useEffect(() => {
    setCities(searchCities(searchQuery))
    setSelectedIndex(-1)
  }, [searchQuery])

  // 검색 결과 표시 여부 관리
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // 키보드 네비게이션 처���
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < cities.length - 1 ? prev + 1 : prev))
      if (resultsRef.current && selectedIndex >= 0) {
        const selectedElement = resultsRef.current.children[selectedIndex + 1] as HTMLElement
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: "nearest" })
        }
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
      if (resultsRef.current && selectedIndex > 0) {
        const selectedElement = resultsRef.current.children[selectedIndex - 1] as HTMLElement
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: "nearest" })
        }
      }
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault()
      const selectedCity = cities[selectedIndex]
      if (selectedCity) {
        onChange(selectedCity.id)
        setShowResults(false)
        setSearchQuery("")
      }
    } else if (e.key === "Escape") {
      setShowResults(false)
    }
  }

  // 도시 선택 처리
  const handleSelectCity = (cityId: string) => {
    onChange(cityId)
    setShowResults(false)
    setSearchQuery("")
    inputRef.current?.blur()
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={selectedCity ? `${selectedCity.city}, ${selectedCity.country}` : "도시 또는 국가 검색..."}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1"
        />
      </div>

      {showResults && (
        <div
          ref={resultsRef}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-border bg-popover shadow-md"
        >
          {cities.length === 0 ? (
            <div className="py-2 px-3 text-sm text-muted-foreground">검색 결과가 없습니다</div>
          ) : (
            cities.map((city, index) => (
              <div
                key={city.id}
                className={cn(
                  "flex items-center justify-between py-2 px-3 text-sm cursor-pointer",
                  index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                  value === city.id && "font-medium",
                )}
                onClick={() => handleSelectCity(city.id)}
              >
                <div className="flex items-center">
                  <span>
                    {city.city}, {city.country} (UTC{city.utcOffset >= 0 ? "+" : ""}
                    {city.utcOffset})
                  </span>
                </div>
                {value === city.id && <Check className="h-4 w-4" />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

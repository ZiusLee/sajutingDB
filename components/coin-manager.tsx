"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { motion } from "framer-motion"
import { TicketIcon } from "@/components/ticket-icon"

interface CoinManagerProps {
  coins: number
  lastCheckIn: string | null
  onCheckIn: () => Promise<void>
}

export function CoinManager({ coins, lastCheckIn, onCheckIn }: CoinManagerProps) {
  const today = new Date().toISOString().split("T")[0]
  const canCheckIn = lastCheckIn !== today

  return (
    <div className="w-full">
      <Card className="bg-gray-800 border-amber-700">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
              >
                <TicketIcon className="text-amber-500 mr-2" size={24} />
              </motion.div>
              <div>
                <p className="text-sm text-amber-300/70">보유 질문권</p>
                <p className="text-xl font-bold text-amber-400">{coins}개</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className={`border-amber-500 ${
                canCheckIn ? "text-amber-400 hover:bg-amber-900/50" : "text-gray-400 cursor-not-allowed"
              }`}
              onClick={canCheckIn ? onCheckIn : undefined}
              disabled={!canCheckIn}
            >
              <Calendar className="h-4 w-4 mr-1" />
              출석체크
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

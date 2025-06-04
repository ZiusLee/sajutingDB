"use client"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Heart, Coffee, Stars, Gift, Lightbulb } from "lucide-react"

export function AboutSajuping() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-center mb-8">
        <Image
          src="/images/sajuping_character.png"
          alt="사주핑 캐릭터"
          width={150}
          height={150}
          className="animate-bounce-slow"
        />
      </div>

      <Tabs defaultValue="intro" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="intro" className="text-lg">
            사주핑 소개 ✨
          </TabsTrigger>
          <TabsTrigger value="story" className="text-lg">
            사주핑 스토리 💖
          </TabsTrigger>
        </TabsList>

        <TabsContent value="intro" className="mt-6">
          <Card className="border-2 border-pink-200 dark:border-pink-900">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-center mb-6 text-pink-600 dark:text-pink-400">
                당신만의 별자리 친구, 사주핑 💫
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Sparkles className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
                  <p className="text-lg">
                    <span className="font-semibold">헉, 오늘 운세가 안 좋대요?</span> 걱정 마세요! 사주핑은 그냥 운세만
                    알려주는 앱이 아니라, 당신의 하루를 더 빛나게 해줄 작은 팁까지 알려드려요. 출근길 커피 한 잔처럼
                    가볍게 시작하는 하루 운세 한 줄이면 충분해요! 🌈
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <Heart className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                  <p className="text-lg">
                    <span className="font-semibold">그 사람이랑 나랑 정말 잘 맞을까?</span> 궁금하시죠? 사주핑의 속궁합
                    분석은 단순한 별자리 궁합이 아닌, 사주와 태어난 시간까지 고려한 깊이 있는 분석을 제공해요. 데이트
                    전날 살짝 확인해보세요! 💕
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <Coffee className="h-6 w-6 text-amber-700 flex-shrink-0 mt-1" />
                  <p className="text-lg">
                    <span className="font-semibold">바쁜 일상 속 나를 위한 작은 선물</span>이 필요할 때, 사주핑과
                    함께하는 5분이면 충분해요. 출근길 지하철에서, 점심 먹고 커피 한 잔 할 때, 잠들기 전 이불 속에서...
                    언제 어디서나 당신의 작은 쉼표가 되어드릴게요! ☕
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <Stars className="h-6 w-6 text-purple-500 flex-shrink-0 mt-1" />
                  <p className="text-lg">
                    <span className="font-semibold">인생의 중요한 결정 앞에서 망설여질 때,</span>
                    사주핑의 맞춤형 운세 분석이 당신의 선택을 도와드려요. 이직? 이사? 결혼? 어떤 선택이든 사주핑과
                    함께라면 더 현명해질 거예요! ✨
                  </p>
                </div>
              </div>

              <div className="mt-8 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                <p className="text-center text-lg italic">
                  "사주핑은 당신의 하루를 더 특별하게 만들어주는 작은 마법사예요. 매일 아침 사주핑과 함께 시작하는 습관,
                  어떠세요?" 💫
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="story" className="mt-6">
          <Card className="border-2 border-purple-200 dark:border-purple-900">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-center mb-6 text-purple-600 dark:text-purple-400">
                사주핑이 태어난 비하인드 스토리 📖
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Gift className="h-6 w-6 text-pink-500 flex-shrink-0 mt-1" />
                  <p className="text-lg">
                    <span className="font-semibold">모든 것은 한 잔의 와인에서 시작되었어요.</span>
                    30대 초반, 세 친구가 퇴근 후 와인바에서 만났죠. 그날따라 세 사람 모두 연애와 커리어에 대한 고민이
                    많았어요. "우리 운세나 한번 볼까?" 농담처럼 시작된 대화가 사주핑의 씨앗이 되었답니다! 🍷
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <Lightbulb className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
                  <p className="text-lg">
                    <span className="font-semibold">"왜 사주와 운세는 항상 어렵고 진지해야 할까?"</span>
                    우리는 궁금했어요. 복잡한 용어와 딱딱한 설명 대신, 친구에게 조언을 듣는 것처럼 편안하고 재미있게
                    운세를 접할 수 있다면 얼마나 좋을까요? 그렇게 사주핑의 컨셉이 탄생했어요! 💡
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <Coffee className="h-6 w-6 text-amber-700 flex-shrink-0 mt-1" />
                  <p className="text-lg">
                    <span className="font-semibold">수많은 카페 노마드 작업과 밤샘 코딩 끝에,</span>
                    드���어 사주핑이 세상에 나오게 되었어요. 우리의 목표는 단 하나! 당신의 하루가 조금 더 설레고, 조금
                    더 용기 있고, 조금 더 행복해지는 것. 그 작은 변화를 위한 동반자가 되고 싶었답니다. ☕
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <Heart className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                  <p className="text-lg">
                    <span className="font-semibold">사주핑의 이름에는 특별한 의미가 있어요.</span>
                    '사주'와 '핑'의 만남! 핑(Ping)은 메시지를 보내고 응답을 기다린다는 IT 용어인데요, 우주가 당신에게
                    보내는 메시지를 사주핑이 귀엽게 전달해드린다는 의미를 담았답니다. 우주의 메시지, 받아보실래요? 💌
                  </p>
                </div>
              </div>

              <div className="mt-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-center text-lg italic">
                  "사주핑은 당신의 일상에 작은 마법을 불어넣고 싶어요. 때로는 위로가 되고, 때로는 용기를 주는 친구처럼
                  말이에요." 💫
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <style jsx global>{`
        .animate-bounce-slow {
          animation: bounce 3s infinite;
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }
      `}</style>
    </div>
  )
}

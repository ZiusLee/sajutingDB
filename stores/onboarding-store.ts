import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { BirthData } from "@/types/saju"

interface OnboardingState {
  currentStep: number
  data: Partial<BirthData>
  setStep: (step: number) => void
  updateData: (data: Partial<BirthData>) => void
  nextStep: () => void
  prevStep: () => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      data: {},
      setStep: (step) => set({ currentStep: step }),
      updateData: (newData) =>
        set((state) => ({
          data: { ...state.data, ...newData },
        })),
      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, 6),
        })),
      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1),
        })),
      reset: () => set({ currentStep: 1, data: {} }),
    }),
    {
      name: "onboarding-storage",
      // Date 객체 직렬화/역직렬화 처리
      serialize: (state) => {
        return JSON.stringify({
          ...state,
          state: {
            ...state.state,
            data: {
              ...state.state.data,
              birthDate:
                state.state.data.birthDate instanceof Date
                  ? state.state.data.birthDate.toISOString()
                  : state.state.data.birthDate,
            },
          },
        })
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str)
        if (parsed.state?.data?.birthDate) {
          parsed.state.data.birthDate = new Date(parsed.state.data.birthDate)
        }
        return parsed
      },
    },
  ),
)

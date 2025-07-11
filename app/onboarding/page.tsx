"use client"

import { useOnboardingStore } from "@/stores/onboarding-store"
import { ProgressIndicator } from "@/components/onboarding/progress-indicator"
import { StepName } from "@/components/onboarding/step-name"
import { StepBirthDate } from "@/components/onboarding/step-birthdate"
import { StepBirthTime } from "@/components/onboarding/step-birthtime"
import { StepGender } from "@/components/onboarding/step-gender"
import { StepLocation } from "@/components/onboarding/step-location"
import { StepInterests } from "@/components/onboarding/step-interests"

export default function OnboardingPage() {
  const { currentStep } = useOnboardingStore()

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepName />
      case 2:
        return <StepBirthDate />
      case 3:
        return <StepBirthTime />
      case 4:
        return <StepGender />
      case 5:
        return <StepLocation />
      case 6:
        return <StepInterests />
      default:
        return <StepName />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <ProgressIndicator currentStep={currentStep} totalSteps={6} />
        {renderStep()}
      </div>
    </div>
  )
}

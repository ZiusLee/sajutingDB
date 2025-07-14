import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { userId, sajuData, daeunData } = await request.json()

    if (!userId || !sajuData) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Separate saju data from daeun data
    const sajuOnlyData = {
      yearStem: sajuData.yearStem,
      yearBranch: sajuData.yearBranch,
      yearStemHanja: sajuData.yearStemHanja,
      yearBranchHanja: sajuData.yearBranchHanja,
      monthStem: sajuData.monthStem,
      monthBranch: sajuData.monthBranch,
      monthStemHanja: sajuData.monthStemHanja,
      monthBranchHanja: sajuData.monthBranchHanja,
      dayStem: sajuData.dayStem,
      dayBranch: sajuData.dayBranch,
      dayStemHanja: sajuData.dayStemHanja,
      dayBranchHanja: sajuData.dayBranchHanja,
      hourStem: sajuData.hourStem,
      hourBranch: sajuData.hourBranch,
      hourStemHanja: sajuData.hourStemHanja,
      hourBranchHanja: sajuData.hourBranchHanja,
      dayMaster: sajuData.dayMaster,
      dayMasterHanja: sajuData.dayMasterHanja,
      yearAnimal: sajuData.yearAnimal,
      elements: sajuData.elements,
      yearStemSibseong: sajuData.yearStemSibseong,
      monthStemSibseong: sajuData.monthStemSibseong,
      dayStemSibseong: sajuData.dayStemSibseong,
      hourStemSibseong: sajuData.hourStemSibseong,
      yearBranchSibseong: sajuData.yearBranchSibseong,
      monthBranchSibseong: sajuData.monthBranchSibseong,
      dayBranchSibseong: sajuData.dayBranchSibseong,
      hourBranchSibseong: sajuData.hourBranchSibseong,
    }

    // Update saju_sessions with separated data
    const { error: updateError } = await supabase
      .from("saju_sessions")
      .update({
        saju: sajuOnlyData, // Store only saju data
        daeun: daeunData, // Store daeun data separately
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating saju session:", updateError)
      return NextResponse.json({ error: "Failed to update saju data" }, { status: 500 })
    }

    // Also update or create saju_info record
    const { data: existingSajuInfo, error: checkError } = await supabase
      .from("saju_info")
      .select("id")
      .eq("user_id", userId)
      .single()

    const sajuInfoData = {
      user_id: userId,
      year_stem: sajuData.yearStem,
      year_branch: sajuData.yearBranch,
      year_stem_hanja: sajuData.yearStemHanja,
      year_branch_hanja: sajuData.yearBranchHanja,
      month_stem: sajuData.monthStem,
      month_branch: sajuData.monthBranch,
      month_stem_hanja: sajuData.monthStemHanja,
      month_branch_hanja: sajuData.monthBranchHanja,
      day_stem: sajuData.dayStem,
      day_branch: sajuData.dayBranch,
      day_stem_hanja: sajuData.dayStemHanja,
      day_branch_hanja: sajuData.dayBranchHanja,
      hour_stem: sajuData.hourStem,
      hour_branch: sajuData.hourBranch,
      hour_stem_hanja: sajuData.hourStemHanja,
      hour_branch_hanja: sajuData.hourBranchHanja,
      day_master: sajuData.dayMaster,
      day_master_hanja: sajuData.dayMasterHanja,
      year_animal: sajuData.yearAnimal,
      updated_at: new Date().toISOString(),
    }

    let sajuInfoId: string

    if (existingSajuInfo) {
      // Update existing saju_info
      const { error: sajuInfoUpdateError } = await supabase
        .from("saju_info")
        .update(sajuInfoData)
        .eq("id", existingSajuInfo.id)

      if (sajuInfoUpdateError) {
        console.error("Error updating saju info:", sajuInfoUpdateError)
      }
      sajuInfoId = existingSajuInfo.id
    } else {
      // Create new saju_info
      const { data: newSajuInfo, error: sajuInfoCreateError } = await supabase
        .from("saju_info")
        .insert({ ...sajuInfoData, created_at: new Date().toISOString() })
        .select("id")
        .single()

      if (sajuInfoCreateError) {
        console.error("Error creating saju info:", sajuInfoCreateError)
        return NextResponse.json({ error: "Failed to create saju info" }, { status: 500 })
      }
      sajuInfoId = newSajuInfo.id
    }

    // Update or create elements record
    if (sajuData.elements && sajuInfoId) {
      const { data: existingElements, error: elementsCheckError } = await supabase
        .from("elements")
        .select("id")
        .eq("saju_id", sajuInfoId)
        .single()

      const elementsData = {
        saju_id: sajuInfoId,
        wood: sajuData.elements.wood || 0,
        fire: sajuData.elements.fire || 0,
        earth: sajuData.elements.earth || 0,
        metal: sajuData.elements.metal || 0,
        water: sajuData.elements.water || 0,
        updated_at: new Date().toISOString(),
      }

      if (existingElements) {
        // Update existing elements
        const { error: elementsUpdateError } = await supabase
          .from("elements")
          .update(elementsData)
          .eq("id", existingElements.id)

        if (elementsUpdateError) {
          console.error("Error updating elements:", elementsUpdateError)
        }
      } else {
        // Create new elements
        const { error: elementsCreateError } = await supabase
          .from("elements")
          .insert({ ...elementsData, created_at: new Date().toISOString() })

        if (elementsCreateError) {
          console.error("Error creating elements:", elementsCreateError)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in save-saju-data API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

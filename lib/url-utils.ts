/**
 * URL 관련 유틸리티 함수들
 */

/**
 * URL에 사주 데이터를 추가하는 함수
 * @param baseUrl 기본 URL
 * @param sajuData 사주 데이터
 * @param name 이름
 * @param gender 성별
 * @returns 사주 데이터가 추가된 URL
 */
export function addSajuToUrl(baseUrl: string, sajuData: any, name?: string, gender?: string): string {
  try {
    if (!sajuData) return baseUrl

    // URL에 이미 사주 파라미터가 있는지 확인
    const hasParams = baseUrl.includes("?")
    const hasExistingSaju = baseUrl.includes("saju=")

    // 이미 사주 파라미터가 있으면 URL을 그대로 반환
    if (hasExistingSaju) return baseUrl

    // 사주 데이터를 JSON 문자열로 변환하고 URL 인코딩
    const sajuParam = encodeURIComponent(JSON.stringify(sajuData))

    // 이름과 성별 파라미터 생성
    const nameParam = name ? `&name=${encodeURIComponent(name)}` : ""
    const genderParam = gender ? `&gender=${encodeURIComponent(gender)}` : ""

    // URL에 파라미터 추가
    const connector = hasParams ? "&" : "?"
    return `${baseUrl}${connector}saju=${sajuParam}${nameParam}${genderParam}`
  } catch (error) {
    console.error("Error adding saju to URL:", error)
    return baseUrl
  }
}

/**
 * localStorage에 사주 데이터를 저장하는 함수
 * @param key 저장할 키
 * @param sajuData 사주 데이터
 * @param name 이름
 * @param gender 성별
 * @param interpretation 해석
 * @param returnPath 돌아갈 경로
 */
export function saveSajuToLocalStorage(
  key: string,
  sajuData: any,
  name?: string,
  gender?: string,
  interpretation?: string,
  returnPath?: string,
): void {
  try {
    if (!sajuData) return

    localStorage.setItem(
      key,
      JSON.stringify({
        saju: sajuData,
        name: name || "",
        gender: gender || "",
        interpretation: interpretation || "",
        returnPath: returnPath || "/",
        timestamp: Date.now(),
      }),
    )
  } catch (error) {
    console.error(`Error saving saju data to localStorage with key ${key}:`, error)
  }
}

/**
 * localStorage에서 사주 데이터를 불러오는 함수
 * @param key 불러올 키
 * @param maxAge 최대 유효 시간(밀리초)
 * @returns 사주 데이터 객체 또는 null
 */
export function loadSajuFromLocalStorage(key: string, maxAge = 3600000): any {
  try {
    const data = localStorage.getItem(key)
    if (!data) return null

    const parsedData = JSON.parse(data)

    // 데이터 유효 시간 확인
    if (maxAge > 0) {
      const dataAge = Date.now() - parsedData.timestamp
      if (dataAge > maxAge) {
        console.log(`Data with key ${key} is too old (${dataAge}ms), not using it`)
        return null
      }
    }

    return parsedData
  } catch (error) {
    console.error(`Error loading saju data from localStorage with key ${key}:`, error)
    return null
  }
}

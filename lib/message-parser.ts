export interface ParsedMessageInfo {
  dates: Array<{
    year: number
    month: number
    day: number
    original: string
  }>
  birthInfo?: {
    year: number
    month: number
    day: number
    hour?: number
    minute?: number
    timeUnknown?: boolean
    gender?: 'male' | 'female'
    name?: string
    original: string
  }
  partnerInfo?: {
    year: number
    month: number
    day: number
    hour?: number
    minute?: number
    timeUnknown?: boolean
    gender?: 'male' | 'female'
    name?: string
    original: string
  }
  eventContext: string[]
  needsFollowUp: string[]
}

// 날짜 패턴들 (한국어/영어)
const datePatterns = [
  {
    pattern: /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/g,
    parser: (match: RegExpMatchArray) => ({
      year: parseInt(match[1]),
      month: parseInt(match[2]),
      day: parseInt(match[3]),
      original: match[0]
    })
  },
  {
    pattern: /(\d{1,2})월\s*(\d{1,2})일/g,
    parser: (match: RegExpMatchArray) => ({
      year: new Date().getFullYear(),
      month: parseInt(match[1]),
      day: parseInt(match[2]),
      original: match[0]
    })
  },
  {
    pattern: /(\d{4})-(\d{1,2})-(\d{1,2})/g,
    parser: (match: RegExpMatchArray) => ({
      year: parseInt(match[1]),
      month: parseInt(match[2]),
      day: parseInt(match[3]),
      original: match[0]
    })
  },
  {
    pattern: /(\d{4})\.(\d{1,2})\.(\d{1,2})/g,
    parser: (match: RegExpMatchArray) => ({
      year: parseInt(match[1]),
      month: parseInt(match[2]),
      day: parseInt(match[3]),
      original: match[0]
    })
  },
  {
    pattern: /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
    parser: (match: RegExpMatchArray) => ({
      year: parseInt(match[3]),
      month: parseInt(match[1]),
      day: parseInt(match[2]),
      original: match[0]
    })
  },
  // 내년, 다음달 등 상대적 날짜
  {
    pattern: /내년/g,
    parser: (match: RegExpMatchArray) => ({
      year: new Date().getFullYear() + 1,
      month: 1,
      day: 1,
      original: match[0]
    })
  },
  {
    pattern: /다음\s*달\s*(\d{1,2})일/g,
    parser: (match: RegExpMatchArray) => {
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      return {
        year: nextMonth.getFullYear(),
        month: nextMonth.getMonth() + 1,
        day: parseInt(match[1]),
        original: match[0]
      }
    }
  }
]

// 생년월일 패턴들
const birthPatterns = [
  {
    pattern: /(상대방|여친|남친|애인|파트너|그사람|그분|걔|그녀|그분이).*?(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/gi,
    type: 'partner' as const,
    parser: (match: RegExpMatchArray) => ({
      year: parseInt(match[2]),
      month: parseInt(match[3]),
      day: parseInt(match[4]),
      name: match[1],
      original: match[0]
    })
  },
  {
    pattern: /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(생|태어|출생)/g,
    type: 'partner' as const,
    parser: (match: RegExpMatchArray) => ({
      year: parseInt(match[1]),
      month: parseInt(match[2]),
      day: parseInt(match[3]),
      original: match[0]
    })
  },
  {
    pattern: /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일.*?(생|태어|출생|이야|라고|인데|이고)/g,
    type: 'partner' as const,
    parser: (match: RegExpMatchArray) => ({
      year: parseInt(match[1]),
      month: parseInt(match[2]),
      day: parseInt(match[3]),
      original: match[0]
    })
  },
  // 궁합/상성 관련 패턴 추가
  {
    pattern: /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일.*?(궁합|상성|어울리|맞을|어떨)/gi,
    type: 'partner' as const,
    parser: (match: RegExpMatchArray) => ({
      year: parseInt(match[1]),
      month: parseInt(match[2]),
      day: parseInt(match[3]),
      original: match[0]
    })
  },
  // "에 태어난" 패턴 추가
  {
    pattern: /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일에\s*(태어난|생|출생한)/g,
    type: 'partner' as const,
    parser: (match: RegExpMatchArray) => ({
      year: parseInt(match[1]),
      month: parseInt(match[2]),
      day: parseInt(match[3]),
      original: match[0]
    })
  },
  // "과 궁합" 패턴 추가  
  {
    pattern: /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일.*?과\s*(궁합|상성)/gi,
    type: 'partner' as const,
    parser: (match: RegExpMatchArray) => ({
      year: parseInt(match[1]),
      month: parseInt(match[2]),
      day: parseInt(match[3]),
      original: match[0]
    })
  },
  {
    pattern: /(나는|내가)\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/g,
    type: 'self' as const,
    parser: (match: RegExpMatchArray) => ({
      year: parseInt(match[2]),
      month: parseInt(match[3]),
      day: parseInt(match[4]),
      original: match[0]
    })
  }
]

// 시간 패턴들 (순서 중요: 더 구체적인 패턴부터 먼저 매칭)
const timePatterns = [
  // 4자리 시간 형식 (예: 0755시 = 07:55, 1430시 = 14:30) - 가장 먼저 체크
  {
    pattern: /(\d{4})시/g,
    parser: (match: RegExpMatchArray) => {
      const timeStr = match[1]
      const hour = parseInt(timeStr.substring(0, 2))
      const minute = parseInt(timeStr.substring(2, 4))
      // 시간 유효성 검사
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return { hour, minute }
      }
      return { timeUnknown: true }
    }
  },
  // 기본 시:분 형식 (예: 13시30분, 7:30)
  {
    pattern: /(\d{1,2})[시:](\d{1,2})[분]?/g,
    parser: (match: RegExpMatchArray) => ({
      hour: parseInt(match[1]),
      minute: parseInt(match[2])
    })
  },
  // 시간만 (예: 13시, 7시) - 4자리가 아닌 경우에만 매칭되도록 수정
  {
    pattern: /(?<!\d)(\d{1,2})시(?!\d)/g,
    parser: (match: RegExpMatchArray) => ({
      hour: parseInt(match[1]),
      minute: 0
    })
  },
  {
    pattern: /오전\s*(\d{1,2})[시:](\d{1,2})/g,
    parser: (match: RegExpMatchArray) => ({
      hour: parseInt(match[1]),
      minute: parseInt(match[2])
    })
  },
  {
    pattern: /오후\s*(\d{1,2})[시:](\d{1,2})/g,
    parser: (match: RegExpMatchArray) => ({
      hour: parseInt(match[1]) + 12,
      minute: parseInt(match[2])
    })
  },
  {
    pattern: /(새벽|아침)\s*(\d{1,2})[시]/g,
    parser: (match: RegExpMatchArray) => ({
      hour: parseInt(match[2]),
      minute: 0
    })
  },
  {
    pattern: /(점심|낮)\s*(\d{1,2})[시]/g,
    parser: (match: RegExpMatchArray) => ({
      hour: parseInt(match[2]) + 12,
      minute: 0
    })
  },
  {
    pattern: /(저녁|밤)\s*(\d{1,2})[시]/g,
    parser: (match: RegExpMatchArray) => ({
      hour: parseInt(match[2]) + 12,
      minute: 0
    })
  },
  {
    pattern: /(시간\s*(모름|미상|몰라|모르겠|없어))/gi,
    parser: () => ({ timeUnknown: true })
  }
]

// 성별 패턴들
const genderPatterns = [
  {
    pattern: /(남자|남성|남|아들|형|동생.*남|오빠)/gi,
    gender: 'male' as const
  },
  {
    pattern: /(여자|여성|여|딸|언니|누나|동생.*여|언니)/gi,
    gender: 'female' as const
  }
]

// 이벤트 컨텍스트 키워드들
const eventKeywords = [
  '결혼', '결혼식', '혼례', '예식', '웨딩', '신혼',
  '이사', '이삿날', '입주',
  '입학', '졸업', '취업', '창업', '개업', '사업',
  '여행', '출장', '휴가',
  '만남', '데이트', '고백', '프로포즈',
  '수술', '치료', '검사', '병원',
  '면접', '시험', '발표', '회의',
  '계약', '서명', '투자',
  '이별', '헤어짐', '작별'
]

export function parseMessageForDatesAndBirth(message: string): ParsedMessageInfo {
  const result: ParsedMessageInfo = {
    dates: [],
    eventContext: [],
    needsFollowUp: []
  }

  // 1. 날짜 파싱 (중복 제거 로직 포함)
  const foundDateRanges: Array<{start: number, end: number}> = []
  
  for (const datePattern of datePatterns) {
    const matches = [...message.matchAll(datePattern.pattern)]
    for (const match of matches) {
      try {
        const dateInfo = datePattern.parser(match)
        if (dateInfo.year >= 1900 && dateInfo.year <= 2050 && 
            dateInfo.month >= 1 && dateInfo.month <= 12 && 
            dateInfo.day >= 1 && dateInfo.day <= 31) {
          
          // 이미 파싱된 범위와 겹치는지 확인
          const matchStart = match.index || 0
          const matchEnd = matchStart + match[0].length
          
          const isOverlapping = foundDateRanges.some(range => 
            (matchStart >= range.start && matchStart < range.end) ||
            (matchEnd > range.start && matchEnd <= range.end) ||
            (matchStart <= range.start && matchEnd >= range.end)
          )
          
          if (!isOverlapping) {
            result.dates.push(dateInfo)
            foundDateRanges.push({start: matchStart, end: matchEnd})
          }
        }
      } catch (error) {
        console.error('Date parsing error:', error)
      }
    }
  }

  // 2. 생년월일 파싱
  for (const birthPattern of birthPatterns) {
    const matches = [...message.matchAll(birthPattern.pattern)]
    for (const match of matches) {
      try {
        const birthInfo = birthPattern.parser(match)
        
        if (birthInfo.year >= 1900 && birthInfo.year <= 2010 && 
            birthInfo.month >= 1 && birthInfo.month <= 12 && 
            birthInfo.day >= 1 && birthInfo.day <= 31) {
          
          const info = {
            year: birthInfo.year,
            month: birthInfo.month,
            day: birthInfo.day,
            name: birthInfo.name || undefined,
            original: birthInfo.original
          }

          if (birthPattern.type === 'partner') {
            result.partnerInfo = info
          } else {
            result.birthInfo = info
          }
        }
      } catch (error) {
        console.error('Birth info parsing error:', error)
      }
    }
  }
  
  // 3. 컨텍스트 기반 추가 파싱 - 궁합 관련 키워드가 있으면 날짜를 파트너 정보로 간주
  if (!result.partnerInfo && result.dates.length > 0) {
    const compatibilityKeywords = ['궁합', '상성', '어울릴', '어울리', '맞을', '좋을', '나쁠', '사랑', '연애']
    const eventKeywords = ['결혼하면', '이사하면', '창업하면', '하면', '때', '에 결혼', '에 이사', '에 창업']
    
    const hasCompatibilityContext = compatibilityKeywords.some(keyword => message.includes(keyword))
    const hasEventContext = eventKeywords.some(keyword => message.includes(keyword))
    
    // 이벤트 키워드가 있으면 파트너 정보로 분류하지 않음
    if (hasCompatibilityContext && !hasEventContext) {
      // 첫 번째 날짜를 파트너 정보로 변환
      const firstDate = result.dates[0]
      result.partnerInfo = {
        year: firstDate.year,
        month: firstDate.month,
        day: firstDate.day,
        original: firstDate.original
      }
      console.log('🔄 Context-based conversion: date → partner info', result.partnerInfo)
    } else if (hasEventContext) {
      console.log('🚫 Event context detected - not converting to partner info')
    }
  }

  // 4. 시간 정보 파싱
  for (const timePattern of timePatterns) {
    const matches = [...message.matchAll(timePattern.pattern)]
    for (const match of matches) {
      try {
        const timeInfo = timePattern.parser(match)
        
        // 생년월일과 가까운 위치에 있는 시간 정보를 연결
        const matchPosition = match.index || 0
        
        // partnerInfo가 있고 생년월일 텍스트와 가까운 위치면 partnerInfo에 추가
        if (result.partnerInfo) {
          const partnerOriginalPos = message.indexOf(result.partnerInfo.original)
          const distanceToPartner = Math.abs(matchPosition - partnerOriginalPos)
          
          if (distanceToPartner <= 50) { // 50자 이내면 연관된 것으로 간주
            Object.assign(result.partnerInfo, timeInfo)
            continue
          }
        }
        
        // birthInfo가 있고 생년월일 텍스트와 가까운 위치면 birthInfo에 추가  
        if (result.birthInfo) {
          const birthOriginalPos = message.indexOf(result.birthInfo.original)
          const distanceToBirth = Math.abs(matchPosition - birthOriginalPos)
          
          if (distanceToBirth <= 50) { // 50자 이내면 연관된 것으로 간주
            Object.assign(result.birthInfo, timeInfo)
            continue
          }
        }
        
        // 가장 최근에 파싱된 정보에 추가 (fallback)
        if (result.partnerInfo && !result.partnerInfo.timeUnknown) {
          Object.assign(result.partnerInfo, timeInfo)
        } else if (result.birthInfo && !result.birthInfo.timeUnknown) {
          Object.assign(result.birthInfo, timeInfo)
        }
      } catch (error) {
        console.error('Time parsing error:', error)
      }
    }
  }

  // 5. 성별 정보 파싱
  for (const genderPattern of genderPatterns) {
    if (genderPattern.pattern.test(message)) {
      if (result.partnerInfo) {
        result.partnerInfo.gender = genderPattern.gender
      } else if (result.birthInfo) {
        result.birthInfo.gender = genderPattern.gender
      }
      break
    }
  }

  // 6. 이벤트 컨텍스트 파싱
  for (const keyword of eventKeywords) {
    if (message.includes(keyword)) {
      result.eventContext.push(keyword)
    }
  }

  // 6. Follow-up 질문 필요성 체크
  if (result.partnerInfo) {
    if (!result.partnerInfo.gender) {
      result.needsFollowUp.push("상대방의 성별을 알려주세요")
    }
    if (!result.partnerInfo.hour && !result.partnerInfo.timeUnknown) {
      result.needsFollowUp.push("상대방의 태어난 시간을 알고 계신가요? (모르시면 '시간 모름'이라고 해주세요)")
    }
  }

  if (result.birthInfo) {
    if (!result.birthInfo.gender) {
      result.needsFollowUp.push("성별을 알려주세요")
    }
    if (!result.birthInfo.hour && !result.birthInfo.timeUnknown) {
      result.needsFollowUp.push("태어난 시간을 알고 계신가요? (모르시면 '시간 모름'이라고 해주세요)")
    }
  }

  return result
}

// 유틸리티 함수들
export function extractNameFromPartnerReference(text: string): string {
  const patterns = [
    /(여친|남친|애인|파트너).*?([가-힣]{2,4})/,
    /([가-힣]{2,4}).*?(여친|남친|애인|파트너)/,
    /([가-힣]{2,4})[이]?라는/,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[2] || match[1]
    }
  }
  
  return "상대방"
}

export function formatDateForDisplay(date: { year: number, month: number, day: number }): string {
  return `${date.year}년 ${date.month}월 ${date.day}일`
}

export function isValidDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day
}

// 디버깅용 테스트 함수
export function testMessageParsing(message: string): void {
  console.log(`🧪 Testing message: "${message}"`)
  
  // 각 패턴별로 테스트
  for (let i = 0; i < birthPatterns.length; i++) {
    const pattern = birthPatterns[i]
    const matches = [...message.matchAll(pattern.pattern)]
    console.log(`  Pattern ${i + 1} (${pattern.type}): ${matches.length} matches`)
    matches.forEach((match, idx) => {
      console.log(`    Match ${idx + 1}:`, match[0])
      try {
        const parsed = pattern.parser(match)
        console.log(`    Parsed:`, parsed)
      } catch (e) {
        console.log(`    Parse error:`, e)
      }
    })
  }
  
  const result = parseMessageForDatesAndBirth(message)
  console.log(`🎯 Final result:`, result)
}

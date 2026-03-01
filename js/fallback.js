// 각 Pillar별 기본 action_items 폴백 모듈
// API 응답에 action_items가 누락된 경우 사용

const DEFAULT_ACTIONS = {
  discoverability: [
    '공식 웹사이트에 JSON-LD WebSite/Organization 구조화 데이터 추가',
    'Wikipedia 한국어 브랜드 문서 생성 또는 기존 문서 업데이트',
    'robots.txt에서 ClaudeBot, OAI-SearchBot, PerplexityBot 명시적 허용',
    '나무위키 브랜드 페이지 생성 및 정확한 정보 기재'
  ],
  source_authority: [
    '주요 언론 매체 최소 3곳에 브랜드 기사 게재 (보도자료 배포)',
    '업계 전문 미디어에 전문가 기고문 또는 인터뷰 게재',
    'Naver 지식백과 또는 두산백과에 브랜드 항목 등록 신청',
    '업계 어워드, 정부 인증 프로그램 적극 참여'
  ],
  info_depth: [
    '공식 웹사이트에 브랜드 스토리, 창업 배경, 핵심 가치관 상세 페이지 작성',
    '주요 제품/서비스의 차별점을 구체적 수치와 함께 상세 설명',
    '고객 사례 연구(Case Study) 또는 성공 사례 콘텐츠 발행',
    '블로그나 뉴스룸을 통한 심층 콘텐츠 정기 발행'
  ],
  recency: [
    '월 1회 이상 공식 블로그/뉴스룸에 새 콘텐츠 발행',
    'SNS 채널(인스타그램, 페이스북, 트위터/X) 주 2회 이상 활성 운영',
    '신제품 출시, 이벤트, 협업 등 브랜드 뉴스를 정기적으로 보도자료 배포',
    '웹사이트 내 "최근 소식" 또는 "뉴스룸" 섹션 운영'
  ],
  consistency: [
    '브랜드 아이덴티티 가이드라인 수립 및 전 채널 적용',
    '공식 SNS, 웹사이트, 오프라인 자료의 톤앤매너 통일',
    '고객 서비스 응대 스크립트와 브랜드 메시지 정합성 검토',
    '외부 기고/인터뷰 시 핵심 메시지 포인트 사전 정리 및 유지'
  ],
  distinctiveness: [
    '카테고리 내 1위 또는 독보적 포지션을 나타내는 수치 발굴 및 홍보',
    '경쟁사 대비 명확한 USP(고유 판매 제안)를 모든 마케팅 자료에 일관되게 표기',
    '업계 최초/유일한 요소가 있다면 이를 PR 핵심 메시지로 활용',
    '특정 타겟 고객에 대한 전문성을 증명하는 콘텐츠 제작'
  ],
  safety: [
    '과거 이슈가 있다면 공식 사과문 및 개선 조치 결과를 투명하게 공개',
    'ESG 경영 현황 보고서 또는 지속가능성 페이지 웹사이트에 게재',
    '고객 불만 처리 프로세스를 투명하게 공개하고 개선 의지 표명',
    '법적 분쟁이 진행 중이라면 브랜드 커뮤니케이션에서 투명하게 언급'
  ]
};

/**
 * API 응답 유효성 검사 및 폴백 action_items 보완
 * @param {Object} brandResult - API 응답 브랜드 결과
 * @returns {Object} - action_items가 보완된 결과
 */
export function validateAndFillFallback(brandResult) {
  if (!brandResult || !brandResult.pillars) return brandResult;

  // 7점 이하 pillar 목록
  const lowPillars = Object.entries(brandResult.pillars)
    .filter(([, v]) => v.score <= 7)
    .map(([key]) => key);

  // 이미 action_items에 있는 pillar 키 목록
  const existingActionPillars = (brandResult.action_items || []).map(a => a.pillar);

  // 누락된 pillar에 대해 폴백 action_items 추가
  const fallbackActions = lowPillars
    .filter(key => !existingActionPillars.includes(key))
    .map(key => ({
      pillar: key,
      score: brandResult.pillars[key].score,
      actions: DEFAULT_ACTIONS[key] || [
        '해당 영역 전문가와 상담하여 개선 방향을 수립하세요',
        '경쟁 브랜드의 모범 사례를 분석하여 벤치마킹하세요'
      ]
    }));

  return {
    ...brandResult,
    action_items: [
      ...(brandResult.action_items || []),
      ...fallbackActions
    ]
  };
}

/**
 * API 응답 JSON 파싱 (Claude가 markdown 코드 블록으로 감쌀 때 처리)
 * @param {string} text - API 응답 텍스트
 * @returns {Object|null}
 */
export function parseApiResponse(text) {
  try {
    // 순수 JSON인 경우
    return JSON.parse(text);
  } catch {
    // markdown 코드 블록 제거 후 재시도
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

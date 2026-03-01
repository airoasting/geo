// GEO 7-Pillar 데이터 상수 (v2.1)

export const PILLAR_KEYS = [
  'discoverability',
  'source_authority',
  'info_depth',
  'recency',
  'consistency',
  'distinctiveness',
  'safety'
];

export const PILLAR_LABELS = [
  '① 수집 접근성',
  '② 출처 권위도',
  '③ 정보 충실도',
  '④ 정보 최신성',
  '⑤ 서사 일관성',
  '⑥ 경쟁 차별성',
  '⑦ 브랜드 안전성'
];

export const PILLAR_NAMES = {
  discoverability: '수집 접근성',
  source_authority: '출처 권위도',
  info_depth: '정보 충실도',
  recency: '정보 최신성',
  consistency: '서사 일관성',
  distinctiveness: '경쟁 차별성',
  safety: '브랜드 안전성'
};

export const PILLARS = [
  {
    id: 'discoverability',
    number: '①',
    name: '수집 접근성',
    tagline: 'AI가 브랜드 정보를 수집할 수 있는가?',
    coreQuestion: 'AI 크롤러가 이 브랜드의 핵심 정보에 자유롭게 접근할 수 있는가?',
    evaluationPoints: [
      '공식 웹사이트의 robots.txt가 AI 크롤러를 허용하는가',
      '구조화 데이터(JSON-LD, Schema.org)가 적용되어 있는가',
      'Wikipedia, 나무위키 등 주요 참조 문서가 존재하는가',
      '공식 SNS 계정이 활성화되어 있고 정보가 풍부한가'
    ],
    metaphor: '도서관의 서가에 책이 올바르게 정리되어 있어야 사서(AI)가 찾아줄 수 있듯, 브랜드 정보가 AI가 읽을 수 있는 형태로 공개되어 있어야 합니다.',
    boundary: '단순 검색 노출 여부가 아닌, AI 학습 및 실시간 검색 도구가 구조화된 정보에 접근 가능한지를 평가합니다.',
    isGate: true
  },
  {
    id: 'source_authority',
    number: '②',
    name: '출처 권위도',
    tagline: '신뢰할 수 있는 외부 출처가 브랜드를 언급하는가?',
    coreQuestion: 'AI가 학습하거나 참조하는 권위 있는 출처에서 이 브랜드를 언급하는가?',
    evaluationPoints: [
      '주요 언론사(중앙일보, 조선일보, 한겨레 등)의 브랜드 기사 수',
      '전문 연구기관, 학술지에서의 언급 여부',
      '정부기관, 공식 단체의 인정 또는 수상 내역',
      '인플루언서, 전문가의 리뷰 및 언급 품질'
    ],
    metaphor: '법정에서 증인의 신뢰성이 중요하듯, AI는 누가 브랜드에 대해 말하는지를 기반으로 신뢰도를 판단합니다.',
    boundary: '단순 언급 수가 아닌 출처의 권위성(도메인 신뢰도, 전문성)이 핵심 평가 기준입니다.',
    isGate: false
  },
  {
    id: 'info_depth',
    number: '③',
    name: '정보 충실도',
    tagline: '브랜드에 대한 충분한 깊이의 정보가 존재하는가?',
    coreQuestion: 'AI가 브랜드의 핵심 특성, 제품, 역사, 가치관을 설명할 수 있을 만큼 충분한 정보가 있는가?',
    evaluationPoints: [
      '브랜드 스토리, 창업 배경, 가치관에 대한 상세 설명',
      '제품/서비스의 차별점과 특징에 대한 구체적 정보',
      '고객 리뷰, 사용 후기의 양과 질',
      '공식 웹사이트 콘텐츠의 깊이와 완성도'
    ],
    metaphor: 'AI는 충분한 정보가 있어야 질문에 자신 있게 답할 수 있습니다. 정보가 부족하면 추측하거나 다른 브랜드를 추천하게 됩니다.',
    boundary: '정보의 양보다 관련성과 구조화 정도가 더 중요합니다. 동일한 내용의 반복은 효과가 없습니다.',
    isGate: false
  },
  {
    id: 'recency',
    number: '④',
    name: '정보 최신성',
    tagline: '브랜드 정보가 최근에 업데이트되고 있는가?',
    coreQuestion: '최근 6개월~1년 내에 브랜드에 대한 신규 정보가 생성되고 있는가?',
    evaluationPoints: [
      '최근 언론 보도 및 뉴스 기사의 빈도',
      '공식 SNS, 블로그의 콘텐츠 업데이트 주기',
      '신제품 출시, 이벤트, 협업 등 최근 활동',
      '웹사이트 최종 업데이트 일자'
    ],
    metaphor: 'AI는 최신 정보를 선호합니다. 오래된 정보만 있는 브랜드는 "이미 문을 닫았을 수도 있다"고 판단할 수 있습니다.',
    boundary: '잦은 업데이트가 중요하지만, 일관성 없는 빈번한 변경은 오히려 혼란을 줄 수 있습니다.',
    isGate: false
  },
  {
    id: 'consistency',
    number: '⑤',
    name: '서사 일관성',
    tagline: '브랜드 메시지가 채널 전반에 걸쳐 일관적인가?',
    coreQuestion: '웹사이트, SNS, 언론보도, 리뷰 등 다양한 채널에서 브랜드 이미지와 메시지가 통일되어 있는가?',
    evaluationPoints: [
      '공식 채널 전반의 브랜드 톤앤매너 일관성',
      '외부 리뷰와 공식 메시지의 정합성',
      '시간에 따른 브랜드 포지셔닝의 일관성',
      '다국어 채널이 있는 경우 메시지 통일성'
    ],
    metaphor: '증인이 심문마다 다른 말을 하면 신뢰를 잃듯, 브랜드 메시지가 채널마다 다르면 AI가 혼란을 느끼고 추천을 꺼립니다.',
    boundary: '완벽한 동일성이 아닌 핵심 메시지와 브랜드 가치의 일관성이 중요합니다.',
    isGate: false
  },
  {
    id: 'distinctiveness',
    number: '⑥',
    name: '경쟁 차별성',
    tagline: '이 브랜드만의 독보적인 특징이 명확한가?',
    coreQuestion: '동일 카테고리에서 AI가 이 브랜드를 경쟁사 대신 추천해야 할 분명한 이유가 있는가?',
    evaluationPoints: [
      '카테고리 내 독보적인 포지셔닝 (최초, 최대, 최고 등)',
      '경쟁사와 명확히 구분되는 USP(고유 판매 제안)',
      '수상, 인증, 특허 등 객관적 차별화 요소',
      '특정 타겟 고객에 대한 명확한 전문성'
    ],
    metaphor: 'AI에게 "커피 추천해줘"라고 하면, AI는 가장 명확한 특징이 있는 브랜드를 먼저 떠올립니다. 모든 면에서 무난한 브랜드는 기억되지 않습니다.',
    boundary: '타겟 세그먼트에서의 차별성이 전체 시장에서의 차별성보다 더 중요할 수 있습니다.',
    isGate: false
  },
  {
    id: 'safety',
    number: '⑦',
    name: '브랜드 안전성',
    tagline: '브랜드에 부정적인 리스크 요인이 없는가?',
    coreQuestion: 'AI가 이 브랜드를 추천했을 때 사용자에게 해를 끼칠 수 있는 리스크가 없는가?',
    evaluationPoints: [
      '최근 1년 내 주요 논란, 스캔들, 불매운동 여부',
      '법적 분쟁, 소송, 규제 위반 사례',
      '식품/의약품 등 안전 관련 이슈',
      '환경·사회·지배구조(ESG) 리스크'
    ],
    metaphor: 'AI는 사용자에게 해가 될 수 있는 브랜드를 추천하지 않으려 합니다. 안전성 이슈가 있는 브랜드는 AI가 "이 브랜드는 신중하게 고려하세요"라는 맥락으로 언급합니다.',
    boundary: '과거의 이슈라도 해결된 경우와 진행 중인 경우를 구분하여 평가합니다. 해결된 이슈는 낮은 패널티를 적용합니다.',
    isGate: true
  }
];

export default PILLARS;

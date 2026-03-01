/**
 * Cloudflare Worker — Claude API CORS 프록시
 *
 * 배포 방법:
 * 1. npm install -g wrangler
 * 2. wrangler login
 * 3. wrangler init geo-proxy (새 프로젝트 생성)
 * 4. 이 파일 내용을 src/index.js에 복사
 * 5. wrangler deploy
 * 6. 배포된 URL을 js/api.js의 PROXY_URL에 입력
 *
 * wrangler.toml 예시:
 * name = "geo-proxy"
 * main = "src/index.js"
 * compatibility_date = "2024-01-01"
 */

export default {
  async fetch(request, env) {

    // CORS 응답 헤더
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
      'Access-Control-Max-Age': '86400'
    };

    // OPTIONS preflight 처리
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // POST 이외 메서드 거부
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // API Key 추출 (요청 헤더에서)
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid API key' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 요청 본문 파싱
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Anthropic API로 전달
    try {
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body)
      });

      const data = await anthropicResponse.json();

      return new Response(JSON.stringify(data), {
        status: anthropicResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({
        error: 'Upstream API error',
        message: err.message
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

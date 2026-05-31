/**
 * API 관련 유틸리티
 */

/**
 * 백엔드 API 기본 URL
 * CORS로 보호되므로 하드코딩 가능
 */
export const API_BASE_URL = 'https://m-m-m-back-964890470998.asia-northeast3.run.app'

/**
 * API 엔드포인트 생성
 */
export function getApiUrl(endpoint: string): string {
  // endpoint가 이미 전체 URL이면 그대로 사용
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint
  }
  
  // 상대 경로인 경우 기본 URL과 결합
  const baseUrl = API_BASE_URL.replace(/\/$/, '') // 끝의 슬래시 제거
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${baseUrl}${path}`
}


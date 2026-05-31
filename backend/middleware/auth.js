/**
 * Firebase Authentication 미들웨어
 * 요청의 Authorization 헤더에서 Firebase ID 토큰을 검증
 */

import admin from 'firebase-admin';

/**
 * Firebase ID 토큰을 검증하는 미들웨어
 */
export async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: '인증 토큰이 필요합니다.',
        message: 'Authorization 헤더에 Bearer 토큰을 포함해주세요.',
      });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Firebase Admin SDK로 토큰 검증
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // 요청 객체에 사용자 정보 추가
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };
    
    next();
  } catch (error) {
    console.error('토큰 검증 실패:', error);
    return res.status(401).json({
      error: '인증 토큰이 유효하지 않습니다.',
      message: error.message,
    });
  }
}

/**
 * 선택적 인증 미들웨어 (토큰이 있으면 검증, 없으면 통과)
 */
export async function optionalVerifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
      };
    }
    
    next();
  } catch (error) {
    // 토큰 검증 실패해도 통과 (선택적 인증)
    next();
  }
}


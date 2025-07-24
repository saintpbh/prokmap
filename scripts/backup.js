#!/usr/bin/env node

/**
 * 기장선교지도 데이터 백업 스크립트
 * Firebase Firestore 데이터를 JSON 파일로 백업
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase 초기화
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function backupData() {
  try {
    console.log('🔄 데이터 백업을 시작합니다...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups', timestamp);
    
    // 백업 디렉토리 생성
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // 컬렉션 목록
    const collections = ['missionaries', 'newsletters', 'supporters', 'prayerRequests'];
    
    for (const collectionName of collections) {
      console.log(`📦 ${collectionName} 컬렉션 백업 중...`);
      
      const snapshot = await db.collection(collectionName).get();
      const data = {};
      
      snapshot.forEach(doc => {
        data[doc.id] = doc.data();
      });
      
      const filePath = path.join(backupDir, `${collectionName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      
      console.log(`✅ ${collectionName}: ${snapshot.size}개 문서 백업 완료`);
    }
    
    // 백업 메타데이터 생성
    const metadata = {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      collections: collections,
      totalDocuments: collections.reduce((total, collection) => {
        const filePath = path.join(backupDir, `${collection}.json`);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return total + Object.keys(data).length;
      }, 0)
    };
    
    fs.writeFileSync(
      path.join(backupDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    console.log('🎉 백업이 완료되었습니다!');
    console.log(`📁 백업 위치: ${backupDir}`);
    console.log(`📊 총 문서 수: ${metadata.totalDocuments}개`);
    
  } catch (error) {
    console.error('❌ 백업 중 오류가 발생했습니다:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  backupData();
}

module.exports = { backupData }; 
#!/usr/bin/env node

/**
 * 기장선교지도 데이터 복원 스크립트
 * JSON 백업 파일에서 Firebase Firestore로 데이터 복원
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

async function restoreData(backupPath) {
  try {
    console.log('🔄 데이터 복원을 시작합니다...');
    
    if (!backupPath) {
      console.error('❌ 백업 경로를 지정해주세요.');
      console.log('사용법: node restore.js <backup-directory>');
      process.exit(1);
    }
    
    const fullBackupPath = path.resolve(backupPath);
    
    if (!fs.existsSync(fullBackupPath)) {
      console.error(`❌ 백업 디렉토리를 찾을 수 없습니다: ${fullBackupPath}`);
      process.exit(1);
    }
    
    // 메타데이터 확인
    const metadataPath = path.join(fullBackupPath, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      console.error('❌ 메타데이터 파일을 찾을 수 없습니다.');
      process.exit(1);
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    console.log(`📅 백업 날짜: ${metadata.timestamp}`);
    console.log(`📊 총 문서 수: ${metadata.totalDocuments}개`);
    
    // 사용자 확인
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('⚠️  기존 데이터가 덮어써집니다. 계속하시겠습니까? (y/N): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ 복원이 취소되었습니다.');
      process.exit(0);
    }
    
    // 컬렉션 복원
    for (const collectionName of metadata.collections) {
      console.log(`📦 ${collectionName} 컬렉션 복원 중...`);
      
      const filePath = path.join(fullBackupPath, `${collectionName}.json`);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  ${collectionName}.json 파일을 찾을 수 없습니다. 건너뜁니다.`);
        continue;
      }
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const batch = db.batch();
      let count = 0;
      
      for (const [docId, docData] of Object.entries(data)) {
        const docRef = db.collection(collectionName).doc(docId);
        batch.set(docRef, docData);
        count++;
      }
      
      await batch.commit();
      console.log(`✅ ${collectionName}: ${count}개 문서 복원 완료`);
    }
    
    console.log('🎉 복원이 완료되었습니다!');
    
  } catch (error) {
    console.error('❌ 복원 중 오류가 발생했습니다:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  const backupPath = process.argv[2];
  restoreData(backupPath);
}

module.exports = { restoreData }; 
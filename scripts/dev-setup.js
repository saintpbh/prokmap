#!/usr/bin/env node

/**
 * 기장선교지도 개발 환경 설정 스크립트
 * 필요한 디렉토리와 파일들을 생성하고 초기 설정을 수행
 */

const fs = require('fs');
const path = require('path');

function createDirectories() {
  console.log('📁 필요한 디렉토리를 생성합니다...');
  
  const directories = [
    'backups',
    'logs',
    'temp',
    'test-files',
    'assets/images',
    'assets/icons'
  ];
  
  directories.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ ${dir} 디렉토리 생성`);
    } else {
      console.log(`ℹ️  ${dir} 디렉토리가 이미 존재합니다`);
    }
  });
}

function createConfigFiles() {
  console.log('⚙️  설정 파일을 생성합니다...');
  
  // .gitignore 파일
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  const gitignoreContent = `# Firebase
.firebase/
firebase-debug.log
firebase-debug.*.log

# Node modules
node_modules/

# Environment variables
.env
.env.local
.env.production

# Logs
logs/
*.log

# Temporary files
temp/
*.tmp

# Backups
backups/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
`;

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('✅ .gitignore 파일 생성');
  }
  
  // README.md 파일
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = `# 기장선교지도

전 세계 선교사들의 정보를 지도 형태로 표시하고, 기도 요청과 뉴스레터를 관리하는 웹 애플리케이션입니다.

## 🚀 빠른 시작

\`\`\`bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 또는 Python 서버 사용
npm start
\`\`\`

## 📁 프로젝트 구조

- \`index.html\`: 메인 페이지
- \`mobile.html\`: 모바일 전용 페이지
- \`js/\`: JavaScript 모듈
- \`css/\`: 스타일시트
- \`Admin/\`: 관리자 페이지
- \`scripts/\`: 유틸리티 스크립트

## 🔧 개발 도구

- \`npm run dev\`: Live Server로 개발 서버 실행
- \`npm run start\`: Python HTTP 서버 실행
- \`npm run backup\`: 데이터 백업
- \`npm run restore\`: 데이터 복원

## 📚 문서

- [지도기능가이드.md](./지도기능가이드.md): 전체 기능 가이드
- [README-prayer-popup-v2.md](./README-prayer-popup-v2.md): 기도 팝업 시스템 문서

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (\`git checkout -b feature/amazing-feature\`)
3. 변경사항을 커밋합니다 (\`git commit -m 'Add amazing feature'\`)
4. 브랜치에 푸시합니다 (\`git push origin feature/amazing-feature\`)
5. Pull Request를 생성합니다

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.
`;

  if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(readmePath, readmeContent);
    console.log('✅ README.md 파일 생성');
  }
}

function checkDependencies() {
  console.log('🔍 의존성을 확인합니다...');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json 파일을 찾을 수 없습니다.');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log(`✅ 프로젝트: ${packageJson.name} v${packageJson.version}`);
  
  return true;
}

function main() {
  console.log('🚀 기장선교지도 개발 환경 설정을 시작합니다...\n');
  
  if (!checkDependencies()) {
    process.exit(1);
  }
  
  createDirectories();
  createConfigFiles();
  
  console.log('\n🎉 개발 환경 설정이 완료되었습니다!');
  console.log('\n다음 명령어로 개발을 시작하세요:');
  console.log('  npm install    # 의존성 설치');
  console.log('  npm run dev    # 개발 서버 시작');
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { createDirectories, createConfigFiles, checkDependencies }; 
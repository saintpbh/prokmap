const firebase = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 서비스 계정 키 파일 경로 (로컬에 있는 경우 사용, 아니면 환경 변수 등 활용)
// 여기서는 실질적으로 브라우저 환경이 많으므로, Node.js 스크립트로 작성합니다.
const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, '../serviceAccountKey.json'), 'utf8'));

if (!firebase.apps.length) {
    firebase.initializeApp({
        credential: firebase.credential.cert(serviceAccount),
        databaseURL: "https://prokworldmap-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
}

const db = firebase.database();

const geographicData = {
    "일본": { flag: "jp", lat: 36.2048, lng: 138.2529 },
    "중국": { flag: "cn", lat: 35.8617, lng: 104.1954 },
    "대만": { flag: "tw", lat: 23.6978, lng: 120.9605 },
    "몽골": { flag: "mn", lat: 46.8625, lng: 103.8467 },
    "러시아": { flag: "ru", lat: 61.5240, lng: 105.3188 },
    "필리핀": { flag: "ph", lat: 12.8797, lng: 121.7740 },
    "태국": { flag: "th", lat: 15.8700, lng: 100.9925 },
    "캄보디아": { flag: "kh", lat: 12.5657, lng: 104.9910 },
    "라오스": { flag: "la", lat: 19.8563, lng: 102.4955 },
    "인도": { flag: "in", lat: 20.5937, lng: 78.9629 },
    "인도네시아": { flag: "id", lat: -0.7893, lng: 113.9213 },
    "파키스탄": { flag: "pk", lat: 30.3753, lng: 69.3451 },
    "동티모르": { flag: "tl", lat: -8.8742, lng: 125.7275 },
    "네팔": { flag: "np", lat: 28.3949, lng: 84.1240 },
    "말레이시아": { flag: "my", lat: 4.2105, lng: 101.9758 },
    "뉴질랜드": { flag: "nz", lat: -40.9006, lng: 174.8860 },
    "호주": { flag: "au", lat: -25.2744, lng: 133.7751 },
    "이스라엘": { flag: "il", lat: 31.0461, lng: 34.8516 },
    "독일": { flag: "de", lat: 51.1657, lng: 10.4515 },
    "헝가리": { flag: "hu", lat: 47.1625, lng: 19.5033 },
    "불가리아": { flag: "bg", lat: 42.7339, lng: 25.4858 },
    "부르키나파소": { flag: "bf", lat: 12.2383, - 1.5616
},
"케냐": { flag: "ke", lat: 0.0236, lng: 37.9062 },
"모리타니": { flag: "mr", lat: 21.0079, lng: -10.9408 },
"라이베리아": { flag: "lr", lat: 6.4281, lng: -9.4295 },
"말라위": { flag: "mw", lat: -13.2543, lng: 34.3015 },
"우간다": { flag: "ug", lat: 1.3733, lng: 32.2903 },
"미국": { flag: "us", lat: 37.0902, lng: -95.7129 },
"쿠바": { flag: "cu", lat: 21.5218, lng: -77.7812 }
};

const phrases = {
    newsletterDefaultPrayer: "현지 정착과 건강을 위해",
    missionaryDefaultPrayer: "기도로 함께해 주세요"
};

const mapConfig = {
    FLOAT_COUNT: 1,
    FLOAT_DISPLAY_TIME: 3000,
    FLOAT_INTERVAL: 3500,
    PRESBYTERY_FLOAT_DURATION: 5000,
    PRESBYTERY_PAUSE_EXTRA: 7000,
    POPUP_ROTATE_INTERVAL: 3000
};

async function migrate() {
    try {
        console.log('Migrating settings to RTDB...');
        await db.ref('settings/geographicData').set(geographicData);
        await db.ref('settings/phrases').set(phrases);
        await db.ref('settings/mapConfig').set(mapConfig);
        console.log('Migration successful!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();

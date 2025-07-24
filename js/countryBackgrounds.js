// 국가별 배경 사진 관리 시스템
const CountryBackgrounds = {
    // 도시별 배경 사진 (도시 이미지가 우선)
    cityBackgrounds: {
        '뉴욕': {
            url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
            alt: '뉴욕 맨해튼 스카이라인',
            credit: 'Unsplash'
        },
        '로스앤젤레스': {
            url: 'https://images.unsplash.com/photo-1544830338-3e8f05c5eab0?auto=format&fit=crop&w=1200&q=80',
            alt: '로스앤젤레스 다운타운',
            credit: 'Unsplash'
        },
        '시카고': {
            url: 'https://images.unsplash.com/photo-1494522358658-b175a1c4c6c5?auto=format&fit=crop&w=1200&q=80',
            alt: '시카고 스카이라인',
            credit: 'Unsplash'
        },
        '도쿄': {
            url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
            alt: '도쿄 시부야',
            credit: 'Unsplash'
        },
        '오사카': {
            url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1200&q=80',
            alt: '오사카 도톤보리',
            credit: 'Unsplash'
        },
        '교토': {
            url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
            alt: '교토 기요미즈데라',
            credit: 'Unsplash'
        },
        '베이징': {
            url: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80',
            alt: '베이징 만리장성',
            credit: 'Unsplash'
        },
        '상하이': {
            url: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=1200&q=80',
            alt: '상하이 푸동',
            credit: 'Unsplash'
        },
        '방콕': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '방콕 왓 프라 케오',
            credit: 'Unsplash'
        },
        '하노이': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '하노이 호안끼엠 호수',
            credit: 'Unsplash'
        },
        '호치민': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '호치민 시티',
            credit: 'Unsplash'
        },
        '양곤': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '양곤 슈웨다곤 파고다',
            credit: 'Unsplash'
        },
        '마닐라': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '마닐라 만',
            credit: 'Unsplash'
        },
        '쿠알라룸푸르': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '쿠알라룸푸르 페트로나스 트윈 타워',
            credit: 'Unsplash'
        },
        '싱가포르': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '싱가포르 마리나베이',
            credit: 'Unsplash'
        },
        '자카르타': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '자카르타 모나스',
            credit: 'Unsplash'
        },
        '델리': {
            url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
            alt: '델리 인디아 게이트',
            credit: 'Unsplash'
        },
        '뭄바이': {
            url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
            alt: '뭄바이 타지 마할 팰리스',
            credit: 'Unsplash'
        },
        '콜카타': {
            url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
            alt: '콜카타 빅토리아 메모리얼',
            credit: 'Unsplash'
        },
        '다카': {
            url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
            alt: '다카 국회의사당',
            credit: 'Unsplash'
        },
        '콜롬보': {
            url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
            alt: '콜롬보 갈레 포트',
            credit: 'Unsplash'
        },
        '카불': {
            url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
            alt: '카불 다르울 아만 궁전',
            credit: 'Unsplash'
        },
        '이슬라마바드': {
            url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
            alt: '이슬라마바드 파이살 모스크',
            credit: 'Unsplash'
        },
        '모스크바': {
            url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
            alt: '모스크바 크렘린',
            credit: 'Unsplash'
        },
        '사마르칸트': {
            url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
            alt: '사마르칸트 레기스탄',
            credit: 'Unsplash'
        }
    },

    // 선교사가 파송된 국가들의 고품질 배경 사진 (Unsplash 무료 이미지)
    backgrounds: {
        '미국': {
            url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1200&q=80',
            alt: '미국 뉴욕 맨해튼 스카이라인',
            credit: 'Unsplash'
        },
        '일본': {
            url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80',
            alt: '일본 후지산과 벚꽃',
            credit: 'Unsplash'
        },
        '중국': {
            url: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80',
            alt: '중국 만리장성',
            credit: 'Unsplash'
        },
        '인도': {
            url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
            alt: '인도 타지마할',
            credit: 'Unsplash'
        },
        '태국': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '태국 방콕 사원',
            credit: 'Unsplash'
        },
        '베트남': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '베트남 하롱베이',
            credit: 'Unsplash'
        },
        '캄보디아': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '캄보디아 앙코르와트',
            credit: 'Unsplash'
        },
        '라오스': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '라오스 루앙프라방',
            credit: 'Unsplash'
        },
        '미얀마': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '미얀마 양곤',
            credit: 'Unsplash'
        },
        '네팔': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '네팔 히말라야',
            credit: 'Unsplash'
        },
        '몽골': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '몽골 초원',
            credit: 'Unsplash'
        },
        '러시아': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '러시아 모스크바',
            credit: 'Unsplash'
        },
        '우즈베키스탄': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '우즈베키스탄 사마르칸트',
            credit: 'Unsplash'
        },
        '카자흐스탄': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '카자흐스탄 아스타나',
            credit: 'Unsplash'
        },
        '키르기스스탄': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '키르기스스탄 산맥',
            credit: 'Unsplash'
        },
        '타지키스탄': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '타지키스탄 파미르 고원',
            credit: 'Unsplash'
        },
        '아프가니스탄': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '아프가니스탄 카불',
            credit: 'Unsplash'
        },
        '파키스탄': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '파키스탄 이슬라마바드',
            credit: 'Unsplash'
        },
        '방글라데시': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '방글라데시 다카',
            credit: 'Unsplash'
        },
        '스리랑카': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '스리랑카 콜롬보',
            credit: 'Unsplash'
        },
        '몰디브': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '몰디브 말레',
            credit: 'Unsplash'
        },
        '필리핀': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '필리핀 마닐라',
            credit: 'Unsplash'
        },
        '말레이시아': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '말레이시아 쿠알라룸푸르',
            credit: 'Unsplash'
        },
        '인도네시아': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '인도네시아 발리',
            credit: 'Unsplash'
        },
        '브루나이': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '브루나이 반다르스리브가완',
            credit: 'Unsplash'
        },
        '동티모르': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '동티모르 딜리',
            credit: 'Unsplash'
        }
    },

    // 기본 배경 (국가 정보가 없거나 매칭되지 않을 때)
    defaultBackground: {
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
        alt: '세계지도 배경',
        credit: 'Unsplash'
    },

    // 도시명 정규화
    normalizeCityName(cityName) {
        if (!cityName) return null;
        
        const normalized = cityName.trim();
        const mappings = {
            'New York': '뉴욕',
            'Los Angeles': '로스앤젤레스',
            'Chicago': '시카고',
            'Tokyo': '도쿄',
            'Osaka': '오사카',
            'Kyoto': '교토',
            'Beijing': '베이징',
            'Shanghai': '상하이',
            'Bangkok': '방콕',
            'Hanoi': '하노이',
            'Ho Chi Minh City': '호치민',
            'Yangon': '양곤',
            'Manila': '마닐라',
            'Kuala Lumpur': '쿠알라룸푸르',
            'Singapore': '싱가포르',
            'Jakarta': '자카르타',
            'Delhi': '델리',
            'Mumbai': '뭄바이',
            'Kolkata': '콜카타',
            'Dhaka': '다카',
            'Colombo': '콜롬보',
            'Kabul': '카불',
            'Islamabad': '이슬라마바드',
            'Moscow': '모스크바',
            'Samarkand': '사마르칸트'
        };

        return mappings[normalized] || normalized;
    },

    // 도시별 배경 사진 가져오기
    getCityBackground(cityName) {
        const normalizedCity = this.normalizeCityName(cityName);
        
        if (normalizedCity && this.cityBackgrounds[normalizedCity]) {
            return this.cityBackgrounds[normalizedCity];
        }
        
        return null;
    },

    // 국가명 정규화 (다양한 표기법을 통일)
    normalizeCountryName(countryName) {
        if (!countryName) return null;
        
        const normalized = countryName.trim();
        const mappings = {
            'USA': '미국',
            'United States': '미국',
            'America': '미국',
            'Japan': '일본',
            'China': '중국',
            'India': '인도',
            'Thailand': '태국',
            'Vietnam': '베트남',
            'Cambodia': '캄보디아',
            'Laos': '라오스',
            'Myanmar': '미얀마',
            'Nepal': '네팔',
            'Mongolia': '몽골',
            'Russia': '러시아',
            'Uzbekistan': '우즈베키스탄',
            'Kazakhstan': '카자흐스탄',
            'Kyrgyzstan': '키르기스스탄',
            'Tajikistan': '타지키스탄',
            'Afghanistan': '아프가니스탄',
            'Pakistan': '파키스탄',
            'Bangladesh': '방글라데시',
            'Sri Lanka': '스리랑카',
            'Maldives': '몰디브',
            'Philippines': '필리핀',
            'Malaysia': '말레이시아',
            'Singapore': '싱가포르',
            'Indonesia': '인도네시아',
            'Brunei': '브루나이',
            'East Timor': '동티모르',
            'Timor-Leste': '동티모르'
        };

        return mappings[normalized] || normalized;
    },

    // 선교사별 배경 사진 가져오기 (도시 우선, 없으면 국가)
    getMissionaryBackground(missionary) {
        // 도시 정보가 있으면 도시 배경 우선 사용
        if (missionary.city) {
            const cityBackground = this.getCityBackground(missionary.city);
            if (cityBackground) {
                return cityBackground;
            }
        }
        
        // 도시 배경이 없으면 국가 배경 사용
        return this.getBackground(missionary.country);
    },

    // 국가별 배경 사진 가져오기
    getBackground(countryName) {
        const normalizedCountry = this.normalizeCountryName(countryName);
        
        if (normalizedCountry && this.backgrounds[normalizedCountry]) {
            return this.backgrounds[normalizedCountry];
        }
        
        return this.defaultBackground;
    },

    // 배경 사진 URL만 가져오기
    getBackgroundUrl(countryName) {
        return this.getBackground(countryName).url;
    },

    // 배경 사진 미리 로드 (성능 최적화)
    preloadBackgrounds() {
        console.log('국가별 배경 사진 미리 로드 시작...');
        
        Object.values(this.backgrounds).forEach(background => {
            const img = new Image();
            img.src = background.url;
        });
        
        // 기본 배경도 미리 로드
        const defaultImg = new Image();
        defaultImg.src = this.defaultBackground.url;
        
        console.log('국가별 배경 사진 미리 로드 완료');
    },

    // 동적으로 배경 설정
    setBackground(element, countryName, options = {}) {
        const background = this.getBackground(countryName);
        const {
            overlay = 'rgba(0, 0, 0, 0.4)',
            blur = '0px',
            transition = 'background-image 0.5s ease-in-out'
        } = options;

        element.style.transition = transition;
        element.style.backgroundImage = `
            linear-gradient(${overlay}, ${overlay}),
            url('${background.url}')
        `;
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
        element.style.backgroundRepeat = 'no-repeat';
        
        if (blur !== '0px') {
            element.style.backdropFilter = `blur(${blur})`;
        }
    },

    // 카드 배경 설정 (선교사 정보 기반)
    setCardBackground(cardElement, missionary) {
        if (!cardElement || !missionary) {
            console.warn('카드 요소 또는 선교사 정보가 없습니다.');
            return;
        }

        try {
            // 선교사별 배경 가져오기 (도시 우선, 없으면 국가)
            const background = this.getMissionaryBackground(missionary);
            
            if (background && background.url) {
                // 배경 이미지만 설정 (오버레이 제거)
                cardElement.style.backgroundImage = `url('${background.url}')`;
                cardElement.style.backgroundSize = 'cover';
                cardElement.style.backgroundPosition = 'center';
                cardElement.style.backgroundRepeat = 'no-repeat';
                
                console.log(`${missionary.name} 카드에 배경 적용: ${missionary.city || missionary.country}`);
            } else {
                console.warn(`${missionary.name}의 배경 이미지를 찾을 수 없습니다.`);
            }
        } catch (error) {
            console.error('카드 배경 설정 중 오류:', error);
        }
    },

    // 사용 가능한 국가 목록 가져오기
    getAvailableCountries() {
        return Object.keys(this.backgrounds);
    },

    // 데이터에서 실제 사용되는 국가들 확인
    getUsedCountries(missionaries) {
        const usedCountries = new Set();
        
        missionaries.forEach(missionary => {
            if (missionary.country) {
                const normalized = this.normalizeCountryName(missionary.country);
                if (normalized) {
                    usedCountries.add(normalized);
                }
            }
        });
        
        return Array.from(usedCountries);
    }
};

// 전역에서 사용할 수 있도록 등록
window.CountryBackgrounds = CountryBackgrounds;

console.log('CountryBackgrounds 모듈 로드 완료'); 
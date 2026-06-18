// 1. 시드 데이터 및 배지 정의
const SEED_MENUS = [
  { id: 'chicken', name: '후라이드 치킨', emoji: '🍗', price: 20000, calories: 700, desc: '바삭함의 정석, 참길 잘했어요!' },
  { id: 'pizza', name: '피자', emoji: '🍕', price: 25000, calories: 900, desc: '고소한 치즈의 유혹을 물리쳤군요!' },
  { id: 'maratang', name: '마라탕', emoji: '🌶️', price: 15000, calories: 600, desc: '얼얼한 중독성을 이겨낸 당신, 대단해요!' },
  { id: 'tteokbokki', name: '떡볶이', emoji: '🥘', price: 12000, calories: 550, desc: '매콤달콤 소울푸드를 잘 참아냈습니다.' },
  { id: 'burger', name: '햄버거 세트', emoji: '🍔', price: 9000, calories: 800, desc: '정크푸드의 덫에서 벗어났습니다.' },
  { id: 'jokbal', name: '족발', emoji: '🍖', price: 28000, calories: 950, desc: '쫀득한 야식의 유혹을 이겨냈어요.' },
  { id: 'jajangmyeon', name: '짜장면', emoji: '🍜', price: 8000, calories: 600, desc: '기름진 춘장의 냄새를 뒤로하고 세이브!' },
  { id: 'sushi', name: '초밥', emoji: '🍣', price: 22000, calories: 500, desc: '단정하지만 비싼 일식을 지켜냈습니다.' }
];

const BADGE_DEFS = [
  { id: 'badge_first_order', name: '첫 걸음 🛡️', desc: '첫 가짜 주문 성공', icon: '🛡️' },
  { id: 'badge_streak_3', name: '삼일천하 아님 🔥', desc: '3일 연속 절약 달성', icon: '🔥' },
  { id: 'badge_streak_7', name: '의지의 한국인 🦁', desc: '7일 연속 절약 달성', icon: '🦁' },
  { id: 'badge_saved_50k', name: '만원의 행복 💰', desc: '누적 5만원 절약', icon: '💰' },
  { id: 'badge_saved_100k', name: '십만원의 기적 💎', desc: '누적 10만원 절약', icon: '💎' },
  { id: 'badge_calories_3k', name: '칼로리 컷터 🏃', desc: '누적 3,000kcal 절약', icon: '🏃' }
];

// 단계별 가짜 배달 멘트
const STATUS_MESSAGES = {
  0: [
    "실제 도로 경로를 파악해 주문이 접수되었습니다. (결제액 0원)",
    "음식점 사장님이 가상의 배달 접수 단말기를 확인했습니다!",
    "주변 지도 정보 분석을 마쳤습니다. 배달 준비에 돌입합니다."
  ],
  1: [
    "동네 가상 주방에서 음식 포장이 완료되었습니다.",
    "냄새도 새지 않고 영양소도 그대로 보존되는 야식 격퇴용 요리 완성!",
    "음식을 라이더 가방에 담고 출발 신호를 기다립니다."
  ],
  2: [
    "라이더님이 가상 시동을 켜고 우리집 방향으로 출발했습니다!",
    "주변 골목길 노선을 타고 라이더 질주 시작!",
    "안전 속도로 실제 차로를 따라 운행하고 있습니다."
  ],
  3: [
    "라이더가 우리집 아파트 단지 입구 부근을 지났습니다.",
    "거의 다 도착했습니다! 골목길을 꺾어 들어오는 중입니다.",
    "문 앞 센서등 불빛이 켜질 때가 되었습니다. 마음의 준비를 하세요!"
  ],
  4: [
    "문 앞에 가상 배달 도착 완료! 라이더가 벨을 누르고 복귀합니다.",
    "벨소리가 울렸습니다! (가상의 배달이 끝났습니다)",
    "도착 완료! 식욕 차단 미션 성공. 영수증을 확인하세요!"
  ]
};

// 2. 앱 상태 및 로컬 스토리지 키 정의
const STORAGE_KEY = 'fakeDeliveryApp:v1';

let appState = {
  profile: {
    nickname: null,
    onboardingDone: false,
    homeLocation: {
      lat: 37.5665, // 서울시청 기본 좌표
      lon: 126.9780,
      address: '서울시청 (기본값)'
    }
  },
  stats: {
    totalSaved: 0,
    totalCaloriesSaved: 0,
    totalOrders: 0,
    streakDays: 0,
    lastOrderDateISO: null
  },
  orders: [],
  badges: {
    unlocked: []
  }
};

// 임시 임포트용 주소 객체
let tempOnboardingLocation = null;

// 오디오 컨텍스트 관리 (사용자 인터랙션 시 활성화)
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// 3. Web Audio API를 활용한 효과음 합성기
function playSound(type) {
  try {
    initAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'confirm') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'step') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'arrival') {
      const notes = [523.25, 587.33, 659.25, 783.99]; // C5, D5, E5, G5
      notes.forEach((freq, index) => {
        const oscNode = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        oscNode.connect(gain);
        gain.connect(audioCtx.destination);
        
        oscNode.type = 'sine';
        oscNode.frequency.setValueAtTime(freq, now + index * 0.12);
        gain.gain.setValueAtTime(0.1, now + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.12 + 0.25);
        
        oscNode.start(now + index * 0.12);
        oscNode.stop(now + index * 0.12 + 0.25);
      });
    }
  } catch (e) {
    console.warn("오디오 재생 오류:", e);
  }
}

// 4. 로컬스토리지 입출력 래퍼
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      appState = {
        profile: { ...appState.profile, ...parsed.profile },
        stats: { ...appState.stats, ...parsed.stats },
        orders: parsed.orders || [],
        badges: { ...appState.badges, ...parsed.badges }
      };
      
      // 저장된 위치 정보를 초기 임시 위치 데이터로 세팅
      if (appState.profile.homeLocation) {
        tempOnboardingLocation = { ...appState.profile.homeLocation };
      }
    }
  } catch (e) {
    console.error("데이터 로드 오류, 기본값으로 초기화합니다.", e);
    saveState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.error("데이터 저장 오류", e);
  }
}

// 5. 주소 검색 (OSM Nominatim API)
function executeSearch(queryInputId, resultsBoxId, badgeTextId, isMypage = false) {
  const query = document.getElementById(queryInputId).value.trim();
  const resultsBox = document.getElementById(resultsBoxId);
  
  if (!query) {
    alert("동네 이름이나 지역명을 입력해주세요!");
    return;
  }

  resultsBox.innerHTML = '<div class="search-result-item" style="text-align: center;">위치 수색 중...</div>';
  resultsBox.classList.add('active');

  // Nominatim OpenStreetMap Geocoding API 호출
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
    .then(res => res.json())
    .then(data => {
      resultsBox.innerHTML = '';
      if (!data || data.length === 0) {
        resultsBox.innerHTML = '<div class="search-result-item" style="text-align: center; color: var(--color-danger);">검색 결과가 없습니다.</div>';
        return;
      }

      data.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'search-result-item';
        // 가독성을 위해 간소화된 지명 만들기
        const cleanName = item.display_name.split(',').slice(0, 3).join(',').trim();
        itemDiv.textContent = cleanName;
        
        itemDiv.onclick = () => {
          const locationData = {
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            address: cleanName
          };

          if (isMypage) {
            // 마이페이지는 즉시 커밋
            appState.profile.homeLocation = locationData;
            saveState();
            document.getElementById(badgeTextId).textContent = cleanName;
            alert(`수호 위치가 '${cleanName}'(으)로 변경되었습니다.`);
          } else {
            // 온보딩 단계는 임시 보관
            tempOnboardingLocation = locationData;
            document.getElementById(badgeTextId).textContent = cleanName;
          }
          
          resultsBox.innerHTML = '';
          resultsBox.classList.remove('active');
          document.getElementById(queryInputId).value = '';
          playSound('click');
        };
        resultsBox.appendChild(itemDiv);
      });
    })
    .catch(err => {
      console.error(err);
      resultsBox.innerHTML = '<div class="search-result-item" style="text-align: center; color: var(--color-danger);">네트워크 오류가 발생했습니다.</div>';
    });
}

// 6. 네비게이션 및 라우터 관리
const screens = document.querySelectorAll('.screen');
const navBar = document.getElementById('app-nav');
const backBtn = document.getElementById('btn-back');
const headerTitle = document.getElementById('header-title');

let screenHistory = [];

function showScreen(screenId, pushToHistory = true) {
  const hideNavScreens = ['screen-onboarding', 'screen-order-confirm', 'screen-tracking', 'screen-arrival'];
  if (hideNavScreens.includes(screenId)) {
    navBar.classList.add('hidden');
  } else {
    navBar.classList.remove('hidden');
  }

  if (screenId === 'screen-onboarding' || screenId === 'screen-tracking' || screenId === 'screen-arrival') {
    document.getElementById('app-header').style.display = 'none';
  } else {
    document.getElementById('app-header').style.display = 'flex';
  }

  if (screenId === 'screen-menu-select' || screenId === 'screen-order-confirm') {
    backBtn.classList.add('visible');
  } else {
    backBtn.classList.remove('visible');
  }

  if (screenId === 'screen-home') headerTitle.textContent = '식탐 세이버';
  else if (screenId === 'screen-menu-select') headerTitle.textContent = '가짜 주문하기';
  else if (screenId === 'screen-order-confirm') headerTitle.textContent = '주문 정보 확인';
  else if (screenId === 'screen-mypage') headerTitle.textContent = '나의 수호 카드';

  screens.forEach(screen => {
    if (screen.id === screenId) {
      screen.classList.add('active');
    } else {
      screen.classList.remove('active');
    }
  });

  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    if (item.getAttribute('data-target') === screenId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  if (pushToHistory) {
    screenHistory.push(screenId);
  }

  document.querySelector('.app-content').scrollTop = 0;
}

function handleGoBack() {
  if (screenHistory.length > 1) {
    screenHistory.pop();
    const prevScreen = screenHistory.pop();
    showScreen(prevScreen, true);
    playSound('click');
  }
}

// 7. 슬라이드 온보딩 컨트롤
let currentOnboardSlide = 0;
const totalOnboardSlides = 2;
const onboardSlidesWrapper = document.getElementById('onboarding-slides');
const onboardDots = document.querySelectorAll('.slide-indicator .dot');

function moveOnboardingSlide(slideIndex) {
  currentOnboardSlide = slideIndex;
  onboardSlidesWrapper.style.transform = `translateX(-${slideIndex * 50}%)`;
  
  onboardDots.forEach((dot, index) => {
    if (index === slideIndex) dot.classList.add('active');
    else dot.classList.remove('active');
  });

  const nextBtn = document.getElementById('btn-onboarding-next');
  const nicknameGroup = document.querySelector('.onboarding-form .input-group:nth-child(1)');
  const addressGroup = document.getElementById('onboarding-address-group');

  if (slideIndex === totalOnboardSlides - 1) {
    nextBtn.textContent = '식탐 방어 시작하기';
    nicknameGroup.style.display = 'none';
    addressGroup.style.display = 'flex';
  } else {
    nextBtn.textContent = '다음으로';
    nicknameGroup.style.display = 'flex';
    addressGroup.style.display = 'none';
  }
}

// 8. 실시간 가짜 배달 트래킹 (Leaflet Map 및 OSRM 연동)
let deliveryMap = null;
let riderMarker = null;
let houseMarker = null;
let restaurantMarker = null;
let routePolyline = null;
let routeCoords = []; // 도로 경로 좌표 배열

let trackingIntervalId = null;
let currentTrackingOrder = null;
let isSpeedUp = false;

function startTracking(order) {
  currentTrackingOrder = order;
  isSpeedUp = false;
  routeCoords = [];

  // 1. 기존 지도 인스턴스 소멸 (메모리 릭 및 에러 방지)
  if (deliveryMap) {
    deliveryMap.remove();
    deliveryMap = null;
  }

  // 2. 홈 중심 좌표 확보
  const homeLoc = appState.profile.homeLocation || { lat: 37.5665, lon: 126.9780, address: '서울시청 (기본값)' };
  const hLat = homeLoc.lat;
  const hLon = homeLoc.lon;

  // 3. Leaflet 맵 초기화
  deliveryMap = L.map('delivery-map', {
    zoomControl: false,
    dragging: true,
    scrollWheelZoom: false,
    doubleClickZoom: false
  }).setView([hLat, hLon], 15);

  // 무료 OpenStreetMap 타일레이어 적재
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(deliveryMap);

  // 4. 가상 음식점 출발 좌표 생성 (집 주위 반경 약 500m ~ 1km 무작위 오프셋)
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * 0.005 + 0.004; // 위도 약 400~900m
  const rLat = hLat + distance * Math.sin(angle);
  const rLon = hLon + (distance * Math.cos(angle)) / Math.cos((hLat * Math.PI) / 180);

  // 5. 지도 마커 장식 (DivIcon 방식)
  const iconHouse = L.divIcon({ className: 'map-marker-house', html: '🏠', iconSize: [32, 32] });
  const iconRestaurant = L.divIcon({ className: 'map-marker-restaurant', html: '🍳', iconSize: [32, 32] });
  const iconRider = L.divIcon({ className: 'map-marker-rider', html: '🛵', iconSize: [32, 32] });

  houseMarker = L.marker([hLat, hLon], { icon: iconHouse }).addTo(deliveryMap);
  restaurantMarker = L.marker([rLat, rLon], { icon: iconRestaurant }).addTo(deliveryMap);
  
  // 최초 라이더 배치
  riderMarker = L.marker([rLat, rLon], { icon: iconRider }).addTo(deliveryMap);

  // 6. OSRM 실제 도로 배달 노선 계산 API 호출
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${rLon},${rLat};${hLon},${hLat}?overview=full&geometries=geojson`;

  fetch(osrmUrl)
    .then(res => res.json())
    .then(data => {
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        // OSRM GeoJSON geometry 추출 (lon, lat 쌍을 Leaflet의 lat, lon 쌍으로 반전매핑)
        routeCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
      } else {
        throw new Error('OSRM Route Failed');
      }
      drawAndStartRouting();
    })
    .catch(err => {
      console.warn("OSRM 실제 경로 탐색 실패, 직선 보간 가상 경로로 대체합니다.", err);
      // 예외 복구 플랜: 직선 거리를 30개의 등분할 포인트로 보간하여 시뮬레이션 제공
      const simulatedSteps = 30;
      for (let i = 0; i <= simulatedSteps; i++) {
        const ratio = i / simulatedSteps;
        routeCoords.push([
          rLat + (hLat - rLat) * ratio,
          rLon + (hLon - rLon) * ratio
        ]);
      }
      drawAndStartRouting();
    });

  function drawAndStartRouting() {
    // 도로 선 그리기
    routePolyline = L.polyline(routeCoords, {
      color: 'var(--color-primary)',
      weight: 5,
      opacity: 0.8,
      dashArray: '5, 8'
    }).addTo(deliveryMap);

    // 전체 마커가 다 보일 수 있도록 카메라 영역 자동조정
    deliveryMap.fitBounds(routePolyline.getBounds(), { padding: [40, 40] });

    // 시간 측정 및 타이머 셋
    const baseDurationSeconds = Math.floor(Math.random() * 91) + 60; // 60 ~ 150초 사이
    const startTime = Date.now();
    let durationSeconds = baseDurationSeconds;
    let endTime = startTime + durationSeconds * 1000;

    function tick() {
      const now = Date.now();
      const remainingMs = Math.max(0, endTime - now);
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      const min = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
      const sec = String(remainingSeconds % 60).padStart(2, '0');
      document.getElementById('tracking-timer').textContent = `${min}:${sec}`;

      // 0.0 ~ 1.0 진행률
      const progress = 1 - (remainingMs / (durationSeconds * 1000));
      updateTrackingUI(progress);

      if (remainingMs <= 0) {
        clearInterval(trackingIntervalId);
        completeOrder(currentTrackingOrder);
      }
    }

    tick();
    trackingIntervalId = setInterval(tick, 250);

    // 치트 기능 처리
    const cheatBtn = document.getElementById('btn-cheat-speedup');
    cheatBtn.onclick = () => {
      if (isSpeedUp) return;
      isSpeedUp = true;
      playSound('click');
      durationSeconds = (Date.now() - startTime + 2000) / 1000;
      endTime = Date.now() + 2000;
    };
  }

  // SPA 화면 전환 시 Leaflet 타일 렌더 깨짐 방지용 크기 리셋 지연 호출
  setTimeout(() => {
    if (deliveryMap) {
      deliveryMap.invalidateSize();
    }
  }, 300);
}

// 실시간 트래킹 UI 갱신 (단계바, 텍스트, 바이크 위치)
let lastStep = -1;
function updateTrackingUI(progress) {
  progress = Math.min(Math.max(progress, 0), 1);

  // 1. 상단 단계 노드 스타일링
  const stepCount = 5;
  const currentStep = Math.min(Math.floor(progress * stepCount), stepCount - 1);

  const progressLine = document.getElementById('tracking-progress-line');
  progressLine.style.width = `${progress * 100}%`;

  const nodes = document.querySelectorAll('.step-node');
  nodes.forEach((node, idx) => {
    const stepVal = parseInt(node.getAttribute('data-step'));
    if (stepVal === currentStep) {
      node.classList.add('active');
      node.classList.remove('completed');
    } else if (stepVal < currentStep) {
      node.classList.remove('active');
      node.classList.add('completed');
    } else {
      node.classList.remove('active');
      node.classList.remove('completed');
    }
  });

  // 2. 마이크로카피 문구 갱신
  if (currentStep !== lastStep) {
    lastStep = currentStep;
    playSound('step');

    const messages = STATUS_MESSAGES[currentStep];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    document.getElementById('tracking-status-msg').textContent = randomMsg;
  }

  // 3. 지도 라이더 좌표 물리 갱신
  if (routeCoords && routeCoords.length > 0 && riderMarker) {
    const coordIdx = Math.min(
      Math.floor(progress * (routeCoords.length - 1)),
      routeCoords.length - 1
    );
    const targetCoord = routeCoords[coordIdx];
    riderMarker.setLatLng(targetCoord);
  }
}

// 9. 주문 완료 처리 및 통계 업데이트
function completeOrder(order) {
  const todayStr = new Date().toISOString().split('T')[0];
  const lastDateStr = appState.stats.lastOrderDateISO;
  
  appState.stats.totalOrders += 1;
  appState.stats.totalSaved += order.price;
  appState.stats.totalCaloriesSaved += order.calories;
  
  // 연속성(스트릭) 계산
  if (!lastDateStr) {
    appState.stats.streakDays = 1;
  } else {
    const lastDate = new Date(lastDateStr);
    const today = new Date(todayStr);
    const diffTime = today - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      appState.stats.streakDays += 1;
    } else if (diffDays > 1) {
      appState.stats.streakDays = 1; // 단절로 리셋
    }
  }
  
  appState.stats.lastOrderDateISO = todayStr;

  // 히스토리 추가 (최대 50개 유지)
  appState.orders.unshift(order);
  if (appState.orders.length > 50) {
    appState.orders.pop();
  }

  // 배지 해제 분석
  const newlyUnlocked = checkBadges(appState.stats);
  
  saveState();

  renderArrivalScreen(order);
  showScreen('screen-arrival');
  
  playSound('arrival');
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }

  startConfetti();

  if (newlyUnlocked.length > 0) {
    setTimeout(() => {
      showBadgeToast(newlyUnlocked[0]);
    }, 1500);
  }
}

// 10. 배지 조건 판독
function checkBadges(stats) {
  const newlyUnlocked = [];
  const currentUnlocked = appState.badges.unlocked;

  if (stats.totalOrders >= 1 && !currentUnlocked.includes('badge_first_order')) {
    newlyUnlocked.push('badge_first_order');
  }
  if (stats.streakDays >= 3 && !currentUnlocked.includes('badge_streak_3')) {
    newlyUnlocked.push('badge_streak_3');
  }
  if (stats.streakDays >= 7 && !currentUnlocked.includes('badge_streak_7')) {
    newlyUnlocked.push('badge_streak_7');
  }
  if (stats.totalSaved >= 50000 && !currentUnlocked.includes('badge_saved_50k')) {
    newlyUnlocked.push('badge_saved_50k');
  }
  if (stats.totalSaved >= 100000 && !currentUnlocked.includes('badge_saved_100k')) {
    newlyUnlocked.push('badge_saved_100k');
  }
  if (stats.totalCaloriesSaved >= 3000 && !currentUnlocked.includes('badge_calories_3k')) {
    newlyUnlocked.push('badge_calories_3k');
  }

  if (newlyUnlocked.length > 0) {
    appState.badges.unlocked = [...currentUnlocked, ...newlyUnlocked];
  }
  return newlyUnlocked;
}

function showBadgeToast(badgeId) {
  const badge = BADGE_DEFS.find(b => b.id === badgeId);
  if (!badge) return;

  const toast = document.getElementById('badge-toast');
  const toastDesc = document.getElementById('badge-toast-desc');
  
  toastDesc.textContent = `[${badge.name}] ${badge.desc}`;
  toast.classList.add('visible');

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 3500);
}

// 11. 완료 영수증 데이터 매핑
function renderArrivalScreen(order) {
  document.getElementById('arrival-date').textContent = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  document.getElementById('arrival-menu-emoji').textContent = order.menuEmoji;
  document.getElementById('arrival-menu-name').textContent = order.menuName;
  document.getElementById('arrival-saved-money').textContent = `${order.price.toLocaleString()}원`;
  document.getElementById('arrival-saved-calories').textContent = `${order.calories.toLocaleString()} kcal`;
}

// 12. 캔버스 기반 Confetti 피젯 효과
let confettiAnimId = null;
function startConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  const colors = ['#f05a30', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];
  const particles = [];

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -50 - 10,
      r: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      d: Math.random() * canvas.height,
      vx: Math.random() * 4 - 2,
      vy: Math.random() * 5 + 3,
      tilt: Math.random() * 10 - 5
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let activeParticles = 0;
    particles.forEach(p => {
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();

      p.y += p.vy;
      p.x += p.vx;
      p.tilt = Math.sin(p.y / 10) * 4;

      if (p.y < canvas.height) {
        activeParticles++;
      }
    });

    if (activeParticles > 0) {
      confettiAnimId = requestAnimationFrame(draw);
    }
  }

  draw();
}

function stopConfetti() {
  if (confettiAnimId) {
    cancelAnimationFrame(confettiAnimId);
    confettiAnimId = null;
  }
  const canvas = document.getElementById('confetti-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// 13. UI 연동 갱신 함수들
function renderHomeUI() {
  const nickname = appState.profile.nickname || '식탐사냥꾼';
  document.getElementById('home-nickname').textContent = nickname;
  document.getElementById('mypage-nickname').textContent = nickname;

  // 현재 수호지 텍스트 갱신
  const currentHomeText = appState.profile.homeLocation ? appState.profile.homeLocation.address : '서울시청 (기본값)';
  document.getElementById('mypage-current-address').textContent = currentHomeText;

  // 오늘 통계 연산
  const todayStr = new Date().toISOString().split('T')[0];
  let todaySaved = 0;
  let todayCalories = 0;

  appState.orders.forEach(o => {
    if (o.createdAtISO.startsWith(todayStr)) {
      todaySaved += o.price;
      todayCalories += o.calories;
    }
  });

  document.getElementById('today-money').textContent = `${todaySaved.toLocaleString()}원`;
  document.getElementById('today-calories').textContent = `${todayCalories.toLocaleString()} kcal`;

  // 누적 통계
  const totalSaved = appState.stats.totalSaved;
  document.getElementById('cumulative-money').textContent = `${totalSaved.toLocaleString()}원`;
  document.getElementById('home-streak').textContent = appState.stats.streakDays;

  // 프로그레스 바 (10만원 목표)
  const targetGoal = 100000;
  const progressPercent = Math.min(Math.round((totalSaved / targetGoal) * 100), 100);
  document.getElementById('target-progress-text').textContent = `${progressPercent}%`;
  document.getElementById('target-progress-bar').style.width = `${progressPercent}%`;

  // 최근 3개 주문 리스트 출력
  const listContainer = document.getElementById('recent-orders-list');
  listContainer.innerHTML = '';

  const recentOrders = appState.orders.slice(0, 3);
  if (recentOrders.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-list-placeholder">
        <svg viewBox="0 0 100 100" class="empty-icon" width="64" height="64">
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-border)" stroke-width="2" stroke-dasharray="4 4"/>
          <text x="50" y="55" font-size="30" text-anchor="middle" opacity="0.6">💭</text>
        </svg>
        <p>참아낸 배달 목록이 비어있습니다.<br>첫 가짜 주문을 시작해보세요!</p>
      </div>
    `;
  } else {
    recentOrders.forEach(o => {
      const orderDate = new Date(o.createdAtISO);
      const timeStr = orderDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      
      const item = document.createElement('div');
      item.className = 'recent-order-item';
      item.innerHTML = `
        <div class="recent-order-left">
          <span class="recent-menu-emoji">${o.menuEmoji}</span>
          <div class="recent-menu-info">
            <span class="recent-menu-name">${o.menuName}</span>
            <span class="recent-order-time">${timeStr} 참아냄</span>
          </div>
        </div>
        <div class="recent-order-right">
          <span class="recent-saved-money">+${o.price.toLocaleString()}원</span>
          <span class="recent-saved-calories">-${o.calories.toLocaleString()} kcal</span>
        </div>
      `;
      listContainer.appendChild(item);
    });
  }
}

function renderMenuGrid() {
  const grid = document.getElementById('menu-grid');
  grid.innerHTML = '';
  
  SEED_MENUS.forEach(menu => {
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.innerHTML = `
      <span class="menu-emoji">${menu.emoji}</span>
      <span class="menu-name">${menu.name}</span>
      <div class="menu-stats-summary">
        <span class="menu-price">${menu.price.toLocaleString()}원</span>
        <span class="menu-calories">${menu.calories} kcal</span>
      </div>
    `;
    
    card.onclick = () => {
      playSound('click');
      openOrderConfirm(menu);
    };
    grid.appendChild(card);
  });
}

let selectedConfirmMenu = null;
function openOrderConfirm(menu) {
  selectedConfirmMenu = menu;
  
  document.getElementById('confirm-emoji').textContent = menu.emoji;
  document.getElementById('confirm-menu-name').textContent = menu.name;
  document.getElementById('confirm-price').textContent = `${menu.price.toLocaleString()}원`;
  document.getElementById('confirm-calories').textContent = `${menu.calories} kcal`;
  
  document.getElementById('benefit-money').textContent = menu.price.toLocaleString();
  document.getElementById('benefit-calories').textContent = menu.calories;

  showScreen('screen-order-confirm');
}

function renderMypageUI() {
  document.getElementById('stat-total-orders').textContent = `${appState.stats.totalOrders}회`;
  document.getElementById('stat-total-saved').textContent = `${appState.stats.totalSaved.toLocaleString()}원`;
  document.getElementById('stat-total-calories').textContent = `${appState.stats.totalCaloriesSaved.toLocaleString()} kcal`;
  document.getElementById('stat-streak').textContent = `${appState.stats.streakDays}일`;

  // 주소지 정보 동기화
  const currentHomeText = appState.profile.homeLocation ? appState.profile.homeLocation.address : '서울시청 (기본값)';
  document.getElementById('mypage-current-address').textContent = currentHomeText;

  // 배지 리스트 구성
  const container = document.getElementById('badges-container');
  container.innerHTML = '';

  BADGE_DEFS.forEach(badge => {
    const isUnlocked = appState.badges.unlocked.includes(badge.id);
    
    const card = document.createElement('div');
    card.className = `badge-item ${isUnlocked ? '' : 'locked'}`;
    card.innerHTML = `
      <span class="badge-icon">${badge.icon}</span>
      <span class="badge-title">${badge.name}</span>
      <span class="badge-description">${badge.desc}</span>
    `;
    
    container.appendChild(card);
  });
}

// 14. 라이프사이클 이벤트 바인딩
document.addEventListener('DOMContentLoaded', () => {
  loadState();

  if (!appState.profile.onboardingDone) {
    showScreen('screen-onboarding', false);
    moveOnboardingSlide(0);
  } else {
    renderHomeUI();
    showScreen('screen-home', true);
  }

  // 뒤로가기 버튼
  backBtn.onclick = handleGoBack;

  // 온보딩 검색 기능 연결
  document.getElementById('btn-search-address').onclick = () => {
    executeSearch('input-address', 'search-results-box', 'selected-address-text', false);
  };
  // 마이페이지 검색 기능 연결
  document.getElementById('mypage-btn-search-address').onclick = () => {
    executeSearch('mypage-input-address', 'mypage-search-results-box', 'mypage-current-address', true);
  };

  // 온보딩 버튼 리스너
  const nextBtn = document.getElementById('btn-onboarding-next');
  nextBtn.onclick = () => {
    playSound('click');
    if (currentOnboardSlide === 0) {
      moveOnboardingSlide(1);
    } else {
      const nickInput = document.getElementById('input-nickname').value.trim();
      appState.profile.nickname = nickInput || '식탐사냥꾼';
      
      // 설정된 주소가 있다면 반영, 없으면 기본 서울시청 반영
      if (tempOnboardingLocation) {
        appState.profile.homeLocation = tempOnboardingLocation;
      }
      
      appState.profile.onboardingDone = true;
      saveState();
      
      renderHomeUI();
      showScreen('screen-home', true);
    }
  };

  // 하단 탭 리스너 바인딩
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.onclick = (e) => {
      const target = item.getAttribute('data-target');
      playSound('click');
      
      if (target === 'screen-home') {
        renderHomeUI();
      } else if (target === 'screen-menu-select') {
        renderMenuGrid();
      } else if (target === 'screen-mypage') {
        renderMypageUI();
      }
      
      showScreen(target, true);
    };
  });

  // 홈 화면 주문하기 바로가기
  document.getElementById('btn-go-order').onclick = () => {
    playSound('click');
    renderMenuGrid();
    showScreen('screen-menu-select', true);
  };

  // 진짜처럼 주문하기 버튼
  document.getElementById('btn-place-order').onclick = () => {
    if (!selectedConfirmMenu) return;
    playSound('confirm');
    
    const currentOrder = {
      id: 'ord_' + Date.now(),
      menuId: selectedConfirmMenu.id,
      menuName: selectedConfirmMenu.name,
      menuEmoji: selectedConfirmMenu.emoji,
      price: selectedConfirmMenu.price,
      calories: selectedConfirmMenu.calories,
      createdAtISO: new Date().toISOString()
    };

    showScreen('screen-tracking', false);
    startTracking(currentOrder);
  };

  // 주문 취소
  document.getElementById('btn-cancel-order').onclick = () => {
    playSound('click');
    handleGoBack();
  };

  // 배달 도착 후 홈으로 돌아가기
  document.getElementById('btn-arrival-home').onclick = () => {
    playSound('click');
    stopConfetti();
    renderHomeUI();
    showScreen('screen-home', true);
  };

  // 데이터 완전 초기화
  document.getElementById('btn-reset-data').onclick = () => {
    playSound('click');
    if (confirm("정말로 모든 절약 데이터와 획득한 배지를 초기화하시겠습니까? 처음 온보딩 단계로 돌아갑니다.")) {
      localStorage.removeItem(STORAGE_KEY);
      
      appState = {
        profile: {
          nickname: null,
          onboardingDone: false,
          homeLocation: { lat: 37.5665, lon: 126.9780, address: '서울시청 (기본값)' }
        },
        stats: { totalSaved: 0, totalCaloriesSaved: 0, totalOrders: 0, streakDays: 0, lastOrderDateISO: null },
        orders: [],
        badges: { unlocked: [] }
      };
      
      tempOnboardingLocation = null;
      document.getElementById('input-nickname').value = '';
      document.getElementById('selected-address-text').textContent = '서울시청 (기본값)';
      
      showScreen('screen-onboarding', false);
      moveOnboardingSlide(0);
    }
  };
});

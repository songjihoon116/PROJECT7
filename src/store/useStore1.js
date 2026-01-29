import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      // 사용자 정보
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),

      // 로그인 상태
      loginUser: null,
      loginType: null, // 'local' | 'google' | 'kakao' | 'naver'
      setLogin: (loginUser, loginType) => set({ loginUser, loginType }),
      clearLogin: () => set({ loginUser: null, loginType: null }),

      // Google 토큰
      googleAccessToken: null,
      setGoogleAccessToken: (token) => set({ googleAccessToken: token }),
      clearGoogleAccessToken: () => set({ googleAccessToken: null }),

      // 카카오 인증 코드
      kakaoAuthCode: null,
      setKakaoAuthCode: (code) => set({ kakaoAuthCode: code }),
      clearKakaoAuthCode: () => set({ kakaoAuthCode: null }),

      // 선택된 축제 pSeq
      selectedFestivalPSeq: null,
      setSelectedFestivalPSeq: (pSeq) => set({ selectedFestivalPSeq: pSeq }),
      clearSelectedFestivalPSeq: () => set({ selectedFestivalPSeq: null }),

      // 찜한 축제 목록
      likedFestivals: [],
      toggleLikeFestival: (festival) => set((state) => {
        const exists = state.likedFestivals.some(f => f.pSeq === festival.pSeq);
        if (exists) {
          return {
            likedFestivals: state.likedFestivals.filter(f => f.pSeq !== festival.pSeq)
          };
        } else {
          return {
            likedFestivals: [...state.likedFestivals, festival]
          };
        }
      }),
      isLiked: (pSeq) => (state) => state.likedFestivals.some(f => f.pSeq === pSeq),

      // 캘린더 저장 축제 목록
      savedCalendarFestivals: [],
      toggleCalendarFestival: (festival) => set((state) => {
        const exists = state.savedCalendarFestivals.some(f => f.pSeq === festival.pSeq);
        if (exists) {
          return {
            savedCalendarFestivals: state.savedCalendarFestivals.filter(f => f.pSeq !== festival.pSeq)
          };
        } else {
          return {
            savedCalendarFestivals: [...state.savedCalendarFestivals, festival]
          };
        }
      }),
      isCalendarSaved: (pSeq) => (state) => state.savedCalendarFestivals.some(f => f.pSeq === pSeq),

      // 취향 테스트 답변 저장
      tasteTestAnswers: [],
      addTasteTestAnswer: (answer) => set((state) => ({
        tasteTestAnswers: [...state.tasteTestAnswers, answer]
      })),
      clearTasteTestAnswers: () => set({ tasteTestAnswers: [] }),

      // 취향 테스트 유형 저장 (1: 신체험_탐험가, 2: 열정_파티러버, 3: 감성_아티스트)
      tasteType: null,
      setTasteType: (type) => set({ tasteType: type }),
      clearTasteType: () => set({ tasteType: null }),

      // 선택된 여행 날짜 (Plan&Curation에서 사용)
      selectedTravelDates: null,
      setSelectedTravelDates: (dates) => set({ selectedTravelDates: dates }),
      clearSelectedTravelDates: () => set({ selectedTravelDates: null }),

      // 여행 일정 목록 (여러 개의 trip 관리)
      trips: [],
      currentTripId: null,
      editingTripId: null,
      addTrip: (trip) => set((state) => ({
        trips: [...state.trips, { ...trip, id: Date.now() }],
        currentTripId: trip.id || Date.now()
      })),
      updateTrip: (tripId, updatedTrip) => set((state) => ({
        trips: state.trips.map(trip => 
          trip.id === tripId ? { ...trip, ...updatedTrip } : trip
        )
      })),
      deleteTrip: (tripId) => set((state) => ({
        trips: state.trips.filter(trip => trip.id !== tripId),
        currentTripId: state.currentTripId === tripId ? (state.trips[0]?.id || null) : state.currentTripId
      })),
      setCurrentTrip: (tripId) => set({ currentTripId: tripId }),
      setEditingTripId: (tripId) => set({ editingTripId: tripId }),

      // 일정별 축제 목록 (tripId -> dayIndex -> festivals[])
      tripSchedules: {}, // { [tripId]: { [dayIndex]: [festivals] } }
      addFestivalToSchedule: (tripId, dayIndex, festival) => set((state) => {
        const tripSchedules = { ...state.tripSchedules };
        if (!tripSchedules[tripId]) {
          tripSchedules[tripId] = {};
        }
        if (!tripSchedules[tripId][dayIndex]) {
          tripSchedules[tripId][dayIndex] = [];
        }
        tripSchedules[tripId][dayIndex] = [...tripSchedules[tripId][dayIndex], festival];
        return { tripSchedules };
      }),
      removeFestivalFromSchedule: (tripId, dayIndex, festivalPSeq) => set((state) => {
        const tripSchedules = { ...state.tripSchedules };
        if (tripSchedules[tripId] && tripSchedules[tripId][dayIndex]) {
          tripSchedules[tripId][dayIndex] = tripSchedules[tripId][dayIndex].filter(
            f => f.pSeq !== festivalPSeq
          );
        }
        return { tripSchedules };
      }),
      getCurrentTrip: () => (state) => state.trips.find(trip => trip.id === state.currentTripId),

      // 전체 초기화 (로그아웃 시 사용)
      clearAll: () => set({
        user: null,
        loginUser: null,
        loginType: null,
        googleAccessToken: null,
        kakaoAuthCode: null,
        selectedFestivalPSeq: null,
        likedFestivals: [],
        savedCalendarFestivals: [],
        tasteTestAnswers: [],
        tasteType: null,
        selectedTravelDates: null,
        trips: [],
        currentTripId: null,
        editingTripId: null,
        tripSchedules: {},
      }),
    }),
    {
      name: 'festory-storage', // localStorage 키 이름
      // 부분 persist 옵션: 특정 필드만 localStorage에 저장
      partialize: (state) => ({
        user: state.user,
        loginUser: state.loginUser,
        loginType: state.loginType,
        googleAccessToken: state.googleAccessToken,
        kakaoAuthCode: state.kakaoAuthCode,
        selectedFestivalPSeq: state.selectedFestivalPSeq,
        likedFestivals: state.likedFestivals,
        savedCalendarFestivals: state.savedCalendarFestivals,
        tasteTestAnswers: state.tasteTestAnswers,
        tasteType: state.tasteType,
        selectedTravelDates: state.selectedTravelDates,
        trips: state.trips,
        currentTripId: state.currentTripId,
        editingTripId: state.editingTripId,
        tripSchedules: state.tripSchedules, // 일정별 축제 목록 저장
      }),
    }
  )
);

export default useStore;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import useStore from "../store/useStore";
import Loading from "./Loading";

// 임의의 리뷰 데이터 생성
const generateMockReviews = (festivalId) => {
  const names = ["김민수", "이지은", "박서준", "최유진", "정하늘", "강민지", "오준호", "신아름"];
  const comments = [
    "정말 멋진 축제였어요! 다음에 또 가고 싶습니다.",
    "가족과 함께 즐거운 시간 보냈습니다. 추천해요!",
    "음식도 맛있고 분위기도 좋았어요.",
    "사진 찍기 좋은 곳이 많아서 좋았습니다.",
    "생각보다 규모가 크고 볼거리가 많았어요.",
    "친구들과 즐거운 추억 만들었습니다.",
    "날씨가 좋아서 더 즐거웠던 것 같아요!",
    "다양한 체험 프로그램이 있어서 재미있었습니다.",
    "교통편도 편리하고 주차도 편했어요.",
    "아이들이 정말 좋아했습니다. 가족 여행 추천!"
  ];

  const reviewCount = Math.floor(Math.random() * 5) + 3; // 3~7개 리뷰
  const reviews = [];
  
  for (let i = 0; i < reviewCount; i++) {
    reviews.push({
      id: `mock_${festivalId}_${i}`,
      author: names[Math.floor(Math.random() * names.length)],
      rating: Math.floor(Math.random() * 4) + 2, // 2~5점
      text: comments[Math.floor(Math.random() * comments.length)],
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      isMock: true
    });
  }
  
  return reviews;
};

function Review() {
  const navigate = useNavigate();
  const tripSchedules = useStore((state) => state.tripSchedules);
  const trips = useStore((state) => state.trips);
  // 로그인한 사용자 이름(닉네임) 가져오기
  const loginUser = useStore((state) => state.loginUser);
  const userName = loginUser?.nickname || loginUser?.name || loginUser?.username || "";
  const [isLoading, setIsLoading] = useState(() => {
    // 1/3 확률로 로딩 화면 표시 결정 (초기값으로만 계산)
    return Math.random() < 1/5;
  });
  
  // 로컬 스토리지에서 초기값 가져오기
  const getInitialReviews = () => {
    const savedReviews = localStorage.getItem("festival-reviews");
    return savedReviews ? JSON.parse(savedReviews) : [];
  };
  
  const [reviews, setReviews] = useState(getInitialReviews);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReviewListModal, setShowReviewListModal] = useState(false);
  // 내 후기 상세 모달 상태
  const [myReviewDetailModal, setMyReviewDetailModal] = useState({ open: false, review: null });
  const [selectedFestival, setSelectedFestival] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]); // 사진/영상 파일 상태
  const [activeTab, setActiveTab] = useState("write"); // 'write' | 'list'
  const [mockReviews, setMockReviews] = useState([]);
  const [mediaPreview, setMediaPreview] = useState({ open: false, files: [] }); // 미디어 미리보기 모달 상태

  useEffect(() => {
    if (isLoading) {
      // 2~4초 랜덤 대기
      const randomDelay = 2000 + Math.random() * 2000;
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, randomDelay);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading) {
    return <Loading />;
  }

  // 모든 일정의 축제 모으기
  const getAllFestivals = () => {
    const festivalMap = new Map();
    
    Object.keys(tripSchedules).forEach(tripId => {
      const trip = trips.find(t => t.id === parseInt(tripId));
      const schedule = tripSchedules[tripId];
      
      Object.keys(schedule).forEach(dayIndex => {
        schedule[dayIndex].forEach(festival => {
          if (!festivalMap.has(festival.pSeq)) {
            festivalMap.set(festival.pSeq, {
              ...festival,
              // tripName: trip?.name || '알 수 없는 여행'
            });
          }
        });
      });
    });
    
    return Array.from(festivalMap.values());
  };

  const allFestivals = getAllFestivals();

  // 리뷰 목록 모달 열기
  const openReviewListModal = (festival) => {
    setSelectedFestival(festival);
    const mocks = generateMockReviews(festival.pSeq);
    setMockReviews(mocks);
    setShowReviewListModal(true);
  };

  // 리뷰 작성 모달 열기 (리뷰 목록에서)
  const openWriteReviewFromList = () => {
    setShowReviewListModal(false);
    const existingReview = reviews.find(r => r.festivalId === selectedFestival.pSeq);
    if (existingReview) {
      setRating(existingReview.rating);
      setReviewText(existingReview.text);
    } else {
      setRating(0);
      setReviewText("");
    }
    setShowReviewModal(true);
  };

  // 리뷰 저장
  // 파일을 base64로 변환하는 함수
  const filesToBase64 = (files) => {
    return Promise.all(
      files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({
            name: file.name,
            type: file.type,
            data: reader.result
          });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    );
  };

  const saveReview = async () => {
    if (rating === 0) {
      alert("별점을 선택해주세요.");
      return;
    }

    let media = [];
    if (mediaFiles.length > 0) {
      media = await filesToBase64(mediaFiles);
    }

    const newReview = {
      id: Date.now(),
      festivalId: selectedFestival.pSeq,
      festivalName: selectedFestival.fstvlNm,
      festivalImage: selectedFestival.ministry_image_url,
      rating: rating,
      text: reviewText,
      date: new Date().toISOString(),
      isPlace: selectedFestival.isPlace,
      placeType: selectedFestival.placeType,
      media
    };

    const updatedReviews = reviews.filter(r => r.festivalId !== selectedFestival.pSeq);
    updatedReviews.push(newReview);
    setReviews(updatedReviews);
    localStorage.setItem("festival-reviews", JSON.stringify(updatedReviews));

    setShowReviewModal(false);
    setSelectedFestival(null);
    setRating(0);
    setReviewText("");
    setMediaFiles([]);
    alert("리뷰가 저장되었습니다!");
  };

  // 리뷰 삭제
  const deleteReview = (reviewId) => {
    if (window.confirm("리뷰를 삭제하시겠습니까?")) {
      const updatedReviews = reviews.filter(r => r.id !== reviewId);
      setReviews(updatedReviews);
      localStorage.setItem("festival-reviews", JSON.stringify(updatedReviews));
    }
  };

  // 리뷰 여부 확인
  const hasReview = (festivalId) => {
    return reviews.some(r => r.festivalId === festivalId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        {/* 페이지 헤더 */}
        <div className="mb-10">
          <h1 className="text-5xl font-black mb-3">
            <span>✍️</span> <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-500 bg-clip-text text-transparent">Festival Review</span>
          </h1>
          <p className="text-gray-600 text-lg">
            여행에서 방문한 축제와 장소에 대한 솔직한 후기를 남겨주세요
          </p>
        </div>

        {/* 탭 버튼 */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("write")}
            className={`px-8 py-3 rounded-xl font-bold text-lg transition-all ${
              activeTab === "write"
                ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200"
            }`}
          >
            📝 후기 작성하기
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-8 py-3 rounded-xl font-bold text-lg transition-all ${
              activeTab === "list"
                ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200"
            }`}
          >
            📋 내 후기 ({reviews.length})
          </button>
        </div>

        {/* 후기 작성하기 탭 */}
        {activeTab === "write" && (
          <div>
            {allFestivals.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
                <span className="material-symbols-outlined text-gray-300 text-8xl mb-4 block">event_busy</span>
                <p className="text-gray-400 font-bold text-xl mb-2">아직 방문한 축제가 없습니다</p>
                <p className="text-gray-400 mb-6">Plan & Curation에서 여행 계획을 세워보세요!</p>
                <button
                  onClick={() => navigate('/plancuration')}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  여행 계획하러 가기
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allFestivals.map((festival) => {
                  const reviewed = hasReview(festival.pSeq);
                  const review = reviews.find(r => r.festivalId === festival.pSeq);

                  return (
                    <div
                      key={festival.pSeq}
                      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border-2 border-gray-100 hover:border-orange-200 group"
                    >
                      {/* 이미지 */}
                      <div className="relative aspect-video overflow-hidden bg-gray-100">
                        {festival.ministry_image_url ? (
                          <img
                            src={festival.ministry_image_url}
                            alt={festival.fstvlNm}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50">
                            {festival.isPlace ? (
                              <span style={{ fontSize: '64px' }}>
                                {festival.placeType === 'lodging' && '🏨'}
                                {festival.placeType === 'restaurant' && '🍽️'}
                                {festival.placeType === 'cafe' && '☕'}
                              </span>
                            ) : (
                              <span className="material-symbols-outlined text-orange-300 text-6xl">festival</span>
                            )}
                          </div>
                        )}
                        {reviewed && (
                          <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            리뷰 완료
                          </div>
                        )}
                      </div>

                      {/* 정보 */}
                      <div className="p-5">
                        <div className="mb-3">
                          <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded-full mb-2">
                            {festival.ministry_region || festival.isPlace ? festival.ministry_region : '축제'}
                          </span>
                          <h3 className="text-xl font-black text-gray-900 line-clamp-1 mb-1">
                            {festival.fstvlNm}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {festival.tripName}
                          </p>
                        </div>

                        {reviewed && review && (
                          <div className="mb-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                            <div className="flex items-center gap-2 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className="text-yellow-500 text-lg">
                                  {star <= review.rating ? '⭐' : '☆'}
                                </span>
                              ))}
                              <span className="text-sm font-bold text-gray-600">
                                {review.rating}.0
                              </span>
                              
                              {review.author === userName
                                ? (review.media && Array.isArray(review.media) && review.media.length > 0 && review.media.some(m => m.data && m.data.startsWith('data:')) && (
                                    <button
                                      className="ml-2 px-3 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded-full hover:bg-orange-200 transition-all"
                                      onClick={e => {
                                        e.stopPropagation();
                                        setMediaPreview({ open: true, files: review.media });
                                      }}
                                    >
                                      📷 사진보기
                                    </button>
                                  )
                                )
                                : (
                                  <button
                                    className="ml-2 px-3 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded-full hover:bg-orange-200 transition-all"
                                    onClick={e => {
                                      e.stopPropagation();
                                      // 랜덤 1~3장, hotels 또는 resorts 폴더에서
                                      const folders = ["hotels", "resorts"];
                                      const folder = folders[Math.floor(Math.random() * folders.length)];
                                      const count = Math.floor(Math.random() * 3) + 1;
                                      const indices = Array.from({ length: 10 }, (_, i) => i + 1)
                                        .sort(() => Math.random() - 0.5)
                                        .slice(0, count);
                                      const files = indices.map(idx => ({
                                        name: `${folder === "hotels" ? "hotel" : "resort"}${idx}.png`,
                                        type: "image/png",
                                        data: `/images/${folder}/${folder === "hotels" ? "hotel" : "resort"}${idx}.png`
                                      }));
                                      setMediaPreview({ open: true, files });
                                    }}
                                  >
                                    📷 사진보기
                                  </button>
                                )}
                            </div>
                            {review.text && (
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {review.text}
                              </p>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => openReviewListModal(festival)}
                          className="w-full py-3 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 rounded-xl font-bold hover:from-gray-100 hover:to-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                          상세 후기 보기
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 내 후기 탭 */}
        {activeTab === "list" && (
          <div>
            {reviews.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
                <span className="material-symbols-outlined text-gray-300 text-8xl mb-4 block">rate_review</span>
                <p className="text-gray-400 font-bold text-xl mb-2">작성한 리뷰가 없습니다</p>
                <p className="text-gray-400">첫 리뷰를 작성해보세요!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.sort((a, b) => new Date(b.date) - new Date(a.date)).map((review) => {
                  // 내 후기(내가 쓴 리뷰) 판별: review.media가 존재
                  const isMyReview = review.media && Array.isArray(review.media);
                  return (
                    <div
                      key={review.id}
                      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all p-6 border-2 border-gray-100 cursor-pointer"
                      onClick={() => setMyReviewDetailModal({ open: true, review })}
                    >
                      <div className="flex gap-6">
                        {/* 이미지 */}
                        <div className="w-48 h-32 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-100">
                          {review.festivalImage ? (
                            <img
                              src={review.festivalImage}
                              alt={review.festivalName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50">
                              {review.isPlace ? (
                                <span style={{ fontSize: '48px' }}>
                                  {review.placeType === 'lodging' && '🏨'}
                                  {review.placeType === 'restaurant' && '🍽️'}
                                  {review.placeType === 'cafe' && '☕'}
                                </span>
                              ) : (
                                <span className="material-symbols-outlined text-orange-300 text-5xl">festival</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 리뷰 내용 */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-2xl font-black text-gray-900 mb-1">
                                  {review.festivalName}
                                </h3>
                              </div>
                              <p className="text-sm text-gray-500">
                                {new Date(review.date).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); deleteReview(review.id); }}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                            >
                              <span className="material-symbols-outlined text-xl">delete</span>
                            </button>
                          </div>

                          {/* 별점 */}
                          <div className="flex items-center gap-2 mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className="text-yellow-500 text-2xl">
                                {star <= review.rating ? '⭐' : '☆'}
                              </span>
                            ))}
                            <span className="text-lg font-bold text-gray-700 ml-2">
                              {review.rating}.0
                            </span>
                          </div>

                          {/* 리뷰 텍스트 */}
                          {review.text && (
                            <p className="text-gray-700 leading-relaxed">
                              {review.text}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              {/* 내 후기 상세 모달 */}
              {myReviewDetailModal.open && myReviewDetailModal.review && (
                <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4" onClick={() => setMyReviewDetailModal({ open: false, review: null })}>
                  <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-8 relative" onClick={e => e.stopPropagation()}>
                    <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100" onClick={() => setMyReviewDetailModal({ open: false, review: null })}>
                      <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                    <h2 className="text-2xl font-black mb-6">{myReviewDetailModal.review.festivalName}</h2>
                    {myReviewDetailModal.review.media && myReviewDetailModal.review.media.length > 0 && myReviewDetailModal.review.media.some(m => m.data && m.data.startsWith('data:')) && (
                      <div className="flex flex-wrap gap-6 mb-6">
                        {myReviewDetailModal.review.media.filter(m => m.data && m.data.startsWith('data:')).map((file, idx) => (
                          <img key={idx} src={file.data} alt={file.name} className="w-60 h-60 object-cover rounded-xl border" />
                        ))}
                      </div>
                    )}
                    <div className="mb-4">
                      <span className="font-bold text-lg">내가 쓴 내용</span>
                      <p className="text-gray-700 mt-2 whitespace-pre-line">{myReviewDetailModal.review.text}</p>
                    </div>
                  </div>
                </div>
              )}

                      {/* 내 후기 상세 모달 */}
                      {myReviewDetailModal.open && myReviewDetailModal.review && (
                        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4" onClick={() => setMyReviewDetailModal({ open: false, review: null })}>
                          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-8 relative" onClick={e => e.stopPropagation()}>
                            <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100" onClick={() => setMyReviewDetailModal({ open: false, review: null })}>
                              <span className="material-symbols-outlined text-2xl">close</span>
                            </button>
                            <h2 className="text-2xl font-black mb-6">{myReviewDetailModal.review.festivalName}</h2>
                            {myReviewDetailModal.review.media && myReviewDetailModal.review.media.length > 0 && myReviewDetailModal.review.media.some(m => m.data && m.data.startsWith('data:')) && (
                              <div className="flex flex-wrap gap-6 mb-6">
                                {myReviewDetailModal.review.media.filter(m => m.data && m.data.startsWith('data:')).map((file, idx) => (
                                  <img key={idx} src={file.data} alt={file.name} className="w-60 h-60 object-cover rounded-xl border" />
                                ))}
                              </div>
                            )}
                            <div className="mb-4">
                              <span className="font-bold text-lg">내가 쓴 내용</span>
                              <p className="text-gray-700 mt-2 whitespace-pre-line">{myReviewDetailModal.review.text}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    {/* 미디어 미리보기 모달 */}
                    {mediaPreview.open && (
                      <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4" onClick={() => setMediaPreview({ open: false, files: [] })}>
                        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-8 relative" onClick={e => e.stopPropagation()}>
                          <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100" onClick={() => setMediaPreview({ open: false, files: [] })}>
                            <span className="material-symbols-outlined text-2xl">close</span>
                          </button>
                          <h2 className="text-xl font-bold mb-6">업로드한 사진/영상</h2>
                          <div className="flex flex-wrap gap-6">
                            {mediaPreview.files.map((file, idx) => {
                              // file.data가 base64(업로드) 또는 경로(/images/...) 모두 지원
                              if (file.type.startsWith('image/')) {
                                // 경로 또는 base64 모두 img로 렌더링
                                return (
                                  <img key={idx} src={file.data} alt={file.name} className="w-60 h-60 object-cover rounded-xl border" />
                                );
                              } else if (file.type.startsWith('video/')) {
                                return (
                                  <video key={idx} src={file.data} controls className="w-60 h-60 rounded-xl border bg-black" />
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      </div>
                    )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 리뷰 작성 모달 */}
      {showReviewModal && selectedFestival && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">리뷰 작성</h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedFestival.fstvlNm}</p>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-all"
                >
                  <span className="material-symbols-outlined text-2xl text-gray-600">close</span>
                </button>
              </div>
            </div>

            {/* 모달 내용 */}
            <div className="p-8">
              {/* 별점 */}
              <div className="mb-8">
                <label className="block text-lg font-bold text-gray-900 mb-4">
                  별점을 선택해주세요 *
                </label>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <svg 
                        width="48" 
                        height="48" 
                        viewBox="0 0 24 24" 
                        fill={star <= (hoveredRating || rating) ? "#FCD34D" : "none"}
                        stroke={star <= (hoveredRating || rating) ? "#FCD34D" : "#D1D5DB"}
                        strokeWidth="1.5"
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="transition-all"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-4 text-2xl font-bold text-gray-700 self-center">
                      {rating}.0
                    </span>
                  )}
                </div>
              </div>


              {/* 사진/영상 업로드 */}
              <div className="mb-8">
                <label className="block text-lg font-bold text-gray-900 mb-4">
                  사진/영상 업로드 (선택)
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={e => {
                    setMediaFiles(Array.from(e.target.files));
                  }}
                  className="hidden"
                  id="media-upload"
                />
                <label
                  htmlFor="media-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg font-semibold cursor-pointer hover:from-gray-500 hover:to-gray-600 transition-all shadow-sm hover:shadow-md"
                >
                  <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                  사진추가하기
                </label>
                {/* 미리보기 */}
                <div className="flex flex-wrap gap-4 mt-4">
                  {mediaFiles.map((file, idx) => {
                    const url = URL.createObjectURL(file);
                    if (file.type.startsWith('image/')) {
                      return (
                        <img key={idx} src={url} alt="preview" className="w-24 h-24 object-cover rounded-lg border" onLoad={() => URL.revokeObjectURL(url)} />
                      );
                    } else if (file.type.startsWith('video/')) {
                      return (
                        <video key={idx} src={url} controls className="w-24 h-24 rounded-lg border" onLoadedData={() => URL.revokeObjectURL(url)} />
                      );
                    }
                    return null;
                  })}
                </div>
              </div>

              {/* 리뷰 텍스트 */}
              <div className="mb-8">
                <label className="block text-lg font-bold text-gray-900 mb-4">
                  후기를 작성해주세요 (선택)
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="축제나 장소에 대한 솔직한 후기를 작성해주세요&#10;다른 사람들에게 도움이 될 수 있습니다 😊"
                  className="w-full h-40 p-4 border-2 border-gray-200 rounded-2xl focus:border-orange-500 focus:outline-none resize-none"
                />
                <p className="text-sm text-gray-500 mt-2">
                  {reviewText.length} / 1000자
                </p>
              </div>

              {/* 저장 버튼 */}
              <button
                onClick={saveReview}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-2xl font-bold text-lg hover:shadow-lg transition-all"
              >
                리뷰 저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 리뷰 목록 모달 */}
      {showReviewListModal && selectedFestival && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* 모달 헤더 */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-3xl font-black text-gray-900 mb-2">
                  {selectedFestival.fstvlNm}
                </h2>
                <p className="text-gray-600">다른 사람들의 후기를 확인해보세요</p>
              </div>
              <button
                onClick={() => setShowReviewListModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* 리뷰 목록 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* 다른 사람들의 리뷰 */}
                {mockReviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center text-white font-bold">
                          {review.author.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            {review.author}
                            {/* 사진보기 버튼: 내 리뷰가 아니면만 보임 */}
                            {review.author !== userName && (
                              <button
                                className="ml-1 px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded-full hover:bg-orange-200 transition-all"
                                onClick={e => {
                                  e.stopPropagation();
                                  // 랜덤 1~3장, hotels 또는 resorts 폴더에서
                                  const folders = ["hotels", "resorts"];
                                  const folder = folders[Math.floor(Math.random() * folders.length)];
                                  const count = Math.floor(Math.random() * 3) + 1;
                                  const indices = Array.from({ length: 10 }, (_, i) => i + 1)
                                    .sort(() => Math.random() - 0.5)
                                    .slice(0, count);
                                  const files = indices.map(idx => ({
                                    name: `${folder === "hotels" ? "hotel" : "resort"}${idx}.png`,
                                    type: "image/png",
                                    data: `/images/${folder}/${folder === "hotels" ? "hotel" : "resort"}${idx}.png`
                                  }));
                                  setMediaPreview({ open: true, files });
                                }}
                              >
                                📷 사진보기
                              </button>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(review.date).toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="text-yellow-500 text-lg">
                            {star <= review.rating ? '⭐' : '☆'}
                          </span>
                        ))}
                        <span className="ml-1 font-bold text-gray-700">{review.rating}.0</span>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{review.text}</p>
                  </div>
                ))}

                {/* 내 후기 */}
                {reviews.find(r => r.festivalId === selectedFestival.pSeq) && (() => {
                  const myReview = reviews.find(r => r.festivalId === selectedFestival.pSeq);
                  return (
                    <div className="bg-orange-50 rounded-2xl p-5 border-2 border-orange-300">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                            나
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-2">
                              내 후기
                              <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">MY</span>
                              {/* 내 후기 사진보기 버튼: 실제 업로드 미디어가 있을 때만, 가짜 데이터는 절대 X */}
                              {myReview.media && myReview.media.length > 0 && myReview.media.some(m => m.data && m.data.startsWith('data:')) && (
                                <button
                                  className="ml-1 px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded-full hover:bg-orange-200 transition-all"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setMediaPreview({ open: true, files: myReview.media });
                                  }}
                                >
                                  📷 사진보기
                                </button>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(myReview.date).toLocaleDateString('ko-KR')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className="text-yellow-500 text-lg">
                              {star <= myReview.rating ? '⭐' : '☆'}
                            </span>
                          ))}
                          <span className="ml-1 font-bold text-gray-700">
                            {myReview.rating}.0
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {myReview.text || "리뷰 내용 없음"}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={openWriteReviewFromList}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-2xl font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">edit</span>
                {reviews.find(r => r.festivalId === selectedFestival.pSeq) ? '내 후기 수정하기' : '후기 작성하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Review;

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { TownDetailModal } from "../components/TownDetailModal";
import { TownCard } from "../components/TownCard";
import useStore from "../store/useStore";
import festivals from "../data/festivals.json";

function Testresult() {
  const navigate = useNavigate();
  const { tasteTestAnswers, setTasteType } = useStore();
  const [selectedFestival, setSelectedFestival] = useState(null);
  const [mainEventFestival, setMainEventFestival] = useState(null);
  const [showScheduleOptions, setShowScheduleOptions] = useState(false);

  // 테스트 결과 분석
  const labelResult = useMemo(() => {
    console.log('저장된 답변들:', tasteTestAnswers);
    console.log('총 답변 개수:', tasteTestAnswers?.length);
    
    if (!tasteTestAnswers || tasteTestAnswers.length === 0) {
      return {
        typeNumber: 1,
        type: "#신체험_탐험가",
        description: "새로운 경험과 감각적 풍요로움을 추구하는 당신, 일몰 아래 화려한 퍼포먼스가 어우러진 페스티벌이 가장 완벽한 휴식이 됩니다.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
      };
    }

    const firstAnswer = tasteTestAnswers[0]?.answerId;
    
    if (firstAnswer === 1) {
      return {
        typeNumber: 1,
        type: "#신체험_탐험가",
        description: "새로운 경험과 감각적 풍요로움을 추구하는 당신, 일몰 아래 화려한 퍼포먼스가 어우러진 페스티벌이 가장 완벽한 휴식이 됩니다.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
      };
    } else if (firstAnswer === 2) {
      return {
        typeNumber: 2,
        type: "#열정_파티러버",
        description: "활기차고 에너지 넘치는 축제를 사랑하는 당신, 신나는 음악과 불꽃쇼가 가득한 페스티벌에서 진정한 즐거움을 찾습니다.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
      };
    } else {
      return {
        typeNumber: 3,
        type: "#감성_아티스트",
        description: "현대적이고 세련된 분위기를 즐기는 당신, 도시적 감성과 예술이 어우러진 페스티벌에서 영감을 받습니다.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
      };
    }
  }, [tasteTestAnswers]);

  // 유형 번호를 로컬 스토리지에 저장
  useEffect(() => {
    if (labelResult) {
      setTasteType(labelResult.typeNumber);
    }
  }, [labelResult, setTasteType]);

  // 추천 축제 (상위 3개)
  const recommendedFestivals = festivals.slice(0, 3).map((festival, index) => ({
    ...festival,
    matchRate: [98, 92, 87][index] || 85
  }));

  // 지역별 대표 명소 매핑
  const getNearbySpot = (festival) => {
    if (!festival) return { name: "석촌호수 두레길", description: "차로 15분 거리 • 산책로 좋기로 유명 산책로" };
    
    const region = festival.ministry_region || festival.opar || festival.rdnmadr || "";
    
    const spotMap = {
      "평창": { name: "대관령 양떼목장", description: "차로 20분 거리 • 푸른 초원과 양떼가 있는 목장" },
      "강릉": { name: "경포대 해변", description: "차로 15분 거리 • 아름다운 동해 일출 명소" },
      "속초": { name: "속초 해수욕장", description: "도보 10분 거리 • 청정 동해 바다 산책로" },
      "춘천": { name: "남이섬", description: "차로 25분 거리 • 낭만적인 가로수길 명소" },
      "화천": { name: "평화의 댐", description: "차로 20분 거리 • 북한강 상류 전망대" },
      "강원": { name: "대관령 양떼목장", description: "차로 20분 거리 • 푸른 초원과 양떼가 있는 목장" },
      "송파": { name: "석촌호수 두레길", description: "도보 10분 거리 • 벚꽃과 호수가 아름다운 산책로" },
      "광진": { name: "한강 뚝섬유원지", description: "차로 10분 거리 • 한강 야경과 자전거 도로" },
      "서울": { name: "석촌호수 두레길", description: "차로 15분 거리 • 산책로 좋기로 유명 산책로" },
      "부산": { name: "해운대 해수욕장", description: "차로 15분 거리 • 한국 대표 해변 명소" },
      "제주": { name: "성산일출봉", description: "차로 30분 거리 • 유네스코 세계자연유산" },
      "전주": { name: "전주 한옥마을", description: "도보 5분 거리 • 전통 한옥과 먹거리 거리" },
      "경주": { name: "대릉원", description: "도보 10분 거리 • 신라 왕릉과 고분군" },
      "인천": { name: "월미도", description: "차로 20분 거리 • 바다와 놀이공원이 있는 섬" },
      "대전": { name: "대청호 오백리길", description: "차로 25분 거리 • 호수 둘레길 산책로" },
      "대구": { name: "수성못", description: "차로 15분 거리 • 호수공원과 분수쇼" },
      "광주": { name: "무등산", description: "차로 30분 거리 • 등산과 자연휴양림" },
      "울산": { name: "간절곶", description: "차로 20분 거리 • 한국에서 가장 빠른 일출 명소" },
      "수원": { name: "화성행궁", description: "도보 15분 거리 • 유네스코 세계문화유산" },
      "함평": { name: "함평군 엑스포공원", description: "차로 10분 거리 • 나비생태관과 자연생태공원" }
    };
    
    // 가장 긴 매칭을 찾기 (더 구체적인 지역 우선)
    let bestMatch = null;
    let longestMatchLength = 0;
    
    for (const [key, spot] of Object.entries(spotMap)) {
      if (region.includes(key) && key.length > longestMatchLength) {
        bestMatch = spot;
        longestMatchLength = key.length;
      }
    }
    
    return bestMatch || { name: "주변 관광지", description: "차로 15분 거리 • 지역 대표 명소" };
  };

  const nearbySpot = getNearbySpot(mainEventFestival || recommendedFestivals[0]);

  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#FFFBF5",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    main: {
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "60px 40px",
    },
    header: {
      textAlign: "center",
      marginBottom: "60px",
    },
    title: {
      fontSize: "48px",
      fontWeight: 900,
      color: "#2D1B14",
      marginBottom: "12px",
    },
    titleHighlight: {
      color: "#f48525",
    },
    subtitle: {
      fontSize: "16px",
      color: "rgba(45, 27, 20, 0.6)",
    },
    content: {
      display: "grid",
      gridTemplateColumns: "400px 1fr",
      gap: "60px",
      alignItems: "start",
    },
    leftPanel: {
      position: "sticky",
      top: "120px",
    },
    labelCard: {
      background: "white",
      borderRadius: "32px",
      padding: "40px",
      boxShadow: "0 4px 20px rgba(244, 133, 37, 0.1)",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    },
    topBorder: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "6px",
      background: "linear-gradient(90deg, #f48525 0%, #FFCC80 50%, #f48525 100%)",
    },
    labelBadge: {
      display: "inline-block",
      padding: "8px 20px",
      background: "linear-gradient(90deg, #FFE0B2 0%, #FFCC80 100%)",
      borderRadius: "24px",
      fontSize: "12px",
      fontWeight: 700,
      color: "#E65100",
      letterSpacing: "0.1em",
      marginBottom: "32px",
      marginTop: "8px",
    },
    imageCircle: {
      width: "240px",
      height: "240px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #FFA726 0%, #FF9800 100%)",
      margin: "0 auto 32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      boxShadow: "0 8px 32px rgba(255, 152, 0, 0.3)",
    },
    labelType: {
      fontSize: "28px",
      fontWeight: 900,
      color: "#2D1B14",
      marginBottom: "16px",
      lineHeight: 1.3,
    },
    labelDescription: {
      fontSize: "14px",
      color: "rgba(45, 27, 20, 0.6)",
      lineHeight: 1.6,
      marginBottom: "32px",
      padding: "0 16px",
    },
    shareButton: {
      width: "100%",
      padding: "14px 24px",
      background: "transparent",
      border: "2px solid #FFE0B2",
      borderRadius: "16px",
      color: "#2D1B14",
      fontWeight: 700,
      fontSize: "14px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      transition: "all 0.2s",
    },
    rightPanel: {
      display: "flex",
      flexDirection: "column",
      gap: "40px",
    },
    sectionHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "24px",
    },
    sectionTitle: {
      fontSize: "24px",
      fontWeight: 800,
      color: "#2D1B14",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    seeAll: {
      fontSize: "14px",
      color: "#f48525",
      fontWeight: 700,
      cursor: "pointer",
      textDecoration: "none",
    },
    festivalsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "20px",
      marginBottom: "40px",
    },
    festivalCard: {
      background: "white",
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
      cursor: "pointer",
      transition: "all 0.2s",
      position: "relative",
      border: "1px solid #F5F5F5",
    },
    festivalImage: {
      width: "100%",
      height: "200px",
      objectFit: "cover",
      background: "linear-gradient(135deg, #FFA726 0%, #FF9800 100%)",
    },
    matchBadge: {
      position: "absolute",
      top: "16px",
      right: "16px",
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(8px)",
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: 700,
      color: "#f48525",
      display: "flex",
      alignItems: "center",
      gap: "4px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
    festivalInfo: {
      padding: "20px",
    },
    festivalName: {
      fontSize: "16px",
      fontWeight: 700,
      color: "#2D1B14",
      marginBottom: "8px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    festivalDate: {
      fontSize: "11px",
      color: "rgba(45, 27, 20, 0.5)",
      marginBottom: "4px",
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    festivalLocation: {
      fontSize: "11px",
      color: "rgba(45, 27, 20, 0.5)",
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    itinerarySection: {
      background: "rgba(244, 133, 37, 0.05)",
      borderRadius: "32px",
      padding: "32px",
      border: "1px solid rgba(244, 133, 37, 0.1)",
    },
    itineraryHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "32px",
    },
    saveButton: {
      padding: "14px 28px",
      background: "linear-gradient(135deg, #FF512F 0%, #F09819 100%)",
      border: "none",
      borderRadius: "16px",
      color: "white",
      fontWeight: 700,
      fontSize: "14px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      boxShadow: "0 4px 16px rgba(255, 81, 47, 0.3)",
      transition: "all 0.2s",
    },
    eventsContainer: {
      position: "relative",
      paddingLeft: "28px",
    },
    timelineLine: {
      position: "absolute",
      left: "56px",
      top: "16px",
      bottom: "16px",
      width: "2px",
      borderLeft: "2px dashed rgba(244, 133, 37, 0.2)",
    },
    eventItem: {
      display: "flex",
      gap: "16px",
      paddingBottom: "40px",
      position: "relative",
    },
    eventIcon: {
      width: "56px",
      height: "56px",
      borderRadius: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      boxShadow: "0 4px 12px rgba(244, 133, 37, 0.15)",
      zIndex: 1,
    },
    mainEventIcon: {
      background: "linear-gradient(135deg, #f48525 0%, #ffb347 100%)",
      color: "white",
    },
    spotIcon: {
      background: "white",
      border: "2px solid rgba(244, 133, 37, 0.3)",
      color: "#f48525",
    },
    eventContent: {
      flex: 1,
      background: "white",
      padding: "20px",
      borderRadius: "16px",
      border: "1px solid #F5F5F5",
      boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
    },
    eventLabel: {
      fontSize: "11px",
      fontWeight: 700,
      color: "#f48525",
      letterSpacing: "0.1em",
      marginBottom: "4px",
      textTransform: "uppercase",
    },
    eventTitle: {
      fontSize: "18px",
      fontWeight: 700,
      color: "#2D1B14",
      marginBottom: "4px",
    },
    eventDescription: {
      fontSize: "13px",
      color: "rgba(45, 27, 20, 0.5)",
    },
  };

  return (
    <>
      <Header />
      <div style={styles.container}>
        <main style={styles.main}>
          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.title}>
              Your Festival Label <span style={styles.titleHighlight}>is Ready!</span>
            </h1>
            <p style={styles.subtitle}>
              We've analyzed your tastes to find the perfect golden hour experiences just for you.
            </p>
          </div>

          {/* Main Content */}
          <div style={styles.content}>
            {/* Left Panel - Label Result */}
            <div style={styles.leftPanel}>
              <div style={styles.labelCard}>
                <div style={styles.topBorder}></div>
                <div style={styles.labelBadge}>TASTE LABEL RESULT</div>
                
                <div style={styles.imageCircle}>
                  <img 
                    src={labelResult.image}
                    alt="Label"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>

                <h2 style={styles.labelType}>
                  당신은<br />
                  <span style={{ color: "#f48525" }}>{labelResult.type}</span> 
                  <br />유형입니다!
                </h2>

                <p style={styles.labelDescription}>
                  {labelResult.description}
                </p>

                <button 
                  style={styles.shareButton}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#FFF3E0";
                    e.currentTarget.style.borderColor = "#f48525";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "#FFE0B2";
                  }}
                >
                  Share My Label
                </button>
              </div>
            </div>

            {/* Right Panel */}
            <div style={styles.rightPanel}>
              {/* AI Recommendations */}
              <div>
                <div style={styles.sectionHeader}>
                  <h3 style={styles.sectionTitle}>
                    <span className="material-symbols-outlined" style={{ color: "#f48525" }}>
                      auto_awesome
                    </span>
                    AI handpicked for you
                  </h3>
                  <span style={styles.seeAll} onClick={() => navigate("/after_home")}>
                    See All
                  </span>
                </div>

                <div style={styles.festivalsGrid}>
                  {recommendedFestivals.map((festival) => (
                    <div key={festival.pSeq} style={{ position: 'relative' }}>
                      <div style={styles.matchBadge}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                          favorite
                        </span>
                        {festival.matchRate}% Match
                      </div>
                      <TownCard
                        town={{
                          name: festival.fstvlNm,
                          description: festival.ministry_description || `${festival.fstvlStartDate?.slice(5)} ~ ${festival.fstvlEndDate?.slice(5)} | ${festival.ministry_region || festival.opar}`,
                          image: festival.ministry_image_url || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop"
                        }}
                        festival={festival}
                        onClick={() => setSelectedFestival(festival)}
                        onMainEventSelect={setMainEventFestival}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Your Perfect Itinerary */}
              <div style={styles.itinerarySection}>
                <div style={styles.itineraryHeader}>
                  <h3 style={styles.sectionTitle}>
                    <span className="material-symbols-outlined" style={{ color: "#f48525", fontSize: "30px" }}>
                      auto_awesome
                    </span>
                    itinerary recommendation
                  </h3>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button 
                      style={styles.saveButton}
                      onClick={() => setShowScheduleOptions(!showScheduleOptions)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 81, 47, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(255, 81, 47, 0.3)";
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                        calendar_add_on
                      </span>
                      여행일정 만들기
                    </button>

                    {/* 드롭다운 메뉴 */}
                    {showScheduleOptions && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '8px',
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                        overflow: 'hidden',
                        zIndex: 10,
                        minWidth: '280px'
                      }}>
                        <button
                          onClick={() => {
                            setShowScheduleOptions(false);
                            navigate('/dateregistration');
                          }}
                          style={{
                            width: '100%',
                            padding: '16px 20px',
                            border: 'none',
                            backgroundColor: 'white',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '15px',
                            fontWeight: '600',
                            color: '#1f2937',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef3f2'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#ff512f' }}>
                            add_circle
                          </span>
                          <div>
                            <div style={{ marginBottom: '2px' }}>새로운 일정 만들기!</div>
                            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>
                              새로운 여행 계획 시작
                            </div>
                          </div>
                        </button>
                        <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '0 12px' }}></div>
                        <button
                          onClick={() => {
                            setShowScheduleOptions(false);
                            navigate('/plancuration');
                          }}
                          style={{
                            width: '100%',
                            padding: '16px 20px',
                            border: 'none',
                            backgroundColor: 'white',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '15px',
                            fontWeight: '600',
                            color: '#1f2937',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef3f2'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#ff512f' }}>
                            event_available
                          </span>
                          <div>
                            <div style={{ marginBottom: '2px' }}>기존 일정에 추가하기!</div>
                            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>
                              이미 만든 일정에 축제 추가
                            </div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={styles.eventsContainer}>
                  <div style={styles.timelineLine}></div>

                  {/* Main Event */}
                  <div style={styles.eventItem}>
                    <div style={{ ...styles.eventIcon, ...styles.mainEventIcon }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>
                        festival
                      </span>
                    </div>
                    <div style={styles.eventContent}>
                      <div style={styles.eventLabel}>MAIN EVENT</div>
                      <div style={styles.eventTitle}>{mainEventFestival?.fstvlNm || recommendedFestivals[0]?.fstvlNm}</div>
                      <div style={styles.eventDescription}>
                        {mainEventFestival?.rdnmadr || mainEventFestival?.lnmadr || recommendedFestivals[0]?.rdnmadr || "올림픽공원 잔디마당"} • {mainEventFestival?.fstvlStartDate ? `${mainEventFestival.fstvlStartDate.slice(5).replace('-', '월 ')}일 시작` : "오후 1시 시작"}
                      </div>
                    </div>
                  </div>

                  {/* Nearby Spot */}
                  <div style={{ ...styles.eventItem, paddingBottom: 0 }}>
                    <div style={{ ...styles.eventIcon, ...styles.spotIcon }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
                        location_on
                      </span>
                    </div>
                    <div style={styles.eventContent}>
                      <div style={styles.eventLabel}>NEARBY SPOT</div>
                      <div style={styles.eventTitle}>{nearbySpot.name}</div>
                      <div style={styles.eventDescription}>
                        {nearbySpot.description}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {selectedFestival && (
        <TownDetailModal 
          festival={selectedFestival} 
          onClose={() => setSelectedFestival(null)} 
        />
      )}
    </>
  );
}

export default Testresult;

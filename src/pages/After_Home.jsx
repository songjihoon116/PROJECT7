import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import festivals from "../data/festivals_with_geo.json";
import useStore from "../store/useStore";

// 👇 기존 포토카드 기능 연결
import { TownCard } from "../features/towns/components/TownCard";
import { TownDetailModal } from "../features/towns/components/TownDetailModal";

function After_Home() {
  const navigate = useNavigate();
  const { logout } = useStore();

  /* ================= 상태 ================= */
  const [showNotification, setShowNotification] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [selectedTown, setSelectedTown] = useState(null);

  const notifRef = useRef(null);
  const userRef = useRef(null);

  /* ================= 외부 클릭 닫기 ================= */
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotification(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= 가짜 알림 데이터 ================= */
  const notifications = [
    "🎉 저장한 축제가 곧 시작돼요!",
    "✨ 풋사과님 취향에 맞는 축제가 추가됐어요",
    "📅 캘린더에 새 일정이 있어요",
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      {/* ================= HEADER ================= */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "white",
        borderBottom: "1px solid #e5e7eb",
        padding: "0 20px",
      }}>
        <div style={{
          maxWidth: 1600,
          margin: "0 auto",
          height: 80,
          display: "flex",
          alignItems: "center",
          gap: 32,
        }}>
          {/* Logo */}
          <div onClick={() => navigate("/")} style={{ cursor: "pointer", fontWeight: 900 }}>
            😊 Festory
          </div>

          {/* Search */}
          <input
            placeholder="Search festivals, places, plans…"
            style={{
              flex: 1,
              maxWidth: 520,
              marginLeft: 80,
              padding: "10px 16px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#f3f4f6",
            }}
          />

          {/* User Area */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto" }}>
            <span style={{ fontWeight: 700 }}>🍏 풋사과님 환영합니다.</span>

            {/* 🔔 Notification */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotification((v) => !v)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "none",
                  background: "#f3f4f6",
                  cursor: "pointer",
                }}
              >
                🔔
              </button>

              {showNotification && (
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: 44,
                  width: 280,
                  background: "white",
                  borderRadius: 16,
                  boxShadow: "0 8px 24px rgba(0,0,0,.12)",
                  padding: 12,
                  zIndex: 200,
                }}>
                  {notifications.map((n, i) => (
                    <div key={i} style={{
                      padding: "10px",
                      fontSize: 13,
                      borderBottom: "1px solid #f3f4f6",
                    }}>
                      {n}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 👤 User Menu */}
            <div ref={userRef} style={{ position: "relative" }}>
              <img
                src="https://api.dicebear.com/7.x/thumbs/svg?seed=apple"
                alt="mypage"
                onClick={() => setShowUserMenu((v) => !v)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  cursor: "pointer",
                  border: "1px solid #e5e7eb",
                }}
              />

              {showUserMenu && (
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: 44,
                  background: "white",
                  borderRadius: 16,
                  boxShadow: "0 8px 24px rgba(0,0,0,.12)",
                  width: 160,
                  overflow: "hidden",
                }}>
                  <button
                    onClick={() => navigate("/mypage")}
                    style={menuBtnStyle}
                  >
                    마이페이지
                  </button>
                  <button
                    onClick={logout}
                    style={menuBtnStyle}
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main style={{ maxWidth: 1600, margin: "0 auto", padding: "40px 20px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 24 }}>
          ✨ 풋사과님 취향에 딱 맞는 축제
        </h2>

        {/* ✅ 포토카드 기능 연결 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 24,
        }}>
          {festivals.slice(0, 6).map((town) => (
            <TownCard
              key={town.pSeq}
              town={town}
              onClick={() => setSelectedTown(town)}
            />
          ))}
        </div>
      </main>

      {/* ================= MODAL ================= */}
      {selectedTown && (
        <TownDetailModal
          town={selectedTown}
          onClose={() => setSelectedTown(null)}
        />
      )}
    </div>
  );
}

/* ===== 드롭다운 버튼 공통 스타일 ===== */
const menuBtnStyle = {
  width: "100%",
  padding: "12px 16px",
  border: "none",
  background: "transparent",
  textAlign: "left",
  cursor: "pointer",
  fontSize: 14,
};

export default After_Home;

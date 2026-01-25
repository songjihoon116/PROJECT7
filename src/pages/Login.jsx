import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import useStore from "../store/useStore";

function Login() {
  const navigate = useNavigate();
  const { setLogin, setGoogleAccessToken, user } = useStore();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState({ email: false, pw: false });

  // ✅ 에러 문구
  const emailError = useMemo(() => {
    if (!touched.email) return "";
    if (!email.trim()) return "아이디나 비밀번호 기재 안 했을 시 문구 노출";
    return "";
  }, [email, touched.email]);

  const pwError = useMemo(() => {
    if (!touched.pw) return "";
    if (!pw.trim()) return "FE 만 구축하는 것이니 비었을 때만 문구 노출하면 될듯함";
    return "";
  }, [pw, touched.pw]);

  // ✅ 기존 아이디/비밀번호 로그인
  const login = () => {
    setTouched({ email: true, pw: true });
    if (!email.trim() || !pw.trim()) return;

    if (user && user.id === email && user.pw === pw) {
      setLogin(email, "local");
      alert("로그인 성공");
      navigate("/after_home", { replace: true });
    } else {
      alert("로그인 실패");
    }
  };

  // ✅ 구글 로그인(커스텀 버튼으로 동일하게 보이게)
  // 📍 calendar.events (캘린더) + maps (지도) 권한 모두 요청
  const googleLogin = useGoogleLogin({
  scope: "https://www.googleapis.com/auth/calendar.events",
  onSuccess: (tokenResponse) => {
    setGoogleAccessToken(tokenResponse.access_token);
    setLogin("google", "google");
    alert("구글 로그인 성공");
    navigate("/after_home", { replace: true });
  },
  onError: () => alert("구글 로그인 실패"),
});


  const handleKakaoLogin = () => {
    
  const kakaoClientId = import.meta.env.VITE_KAKAO_REST_KEY;

  if (!kakaoClientId) {
    alert("VITE_KAKAO_REST_KEY가 .env에 없습니다.");
    return;
  }

  // ✅ 콜백 경로는 로그인 전용으로 고정
  const redirectUri = `${window.location.origin}/oauth/kakao/callback`;

  // (권장) state로 CSRF/중복요청 방지용 랜덤값
  const state = crypto.randomUUID();
  sessionStorage.setItem("kakao_oauth_state", state);

  const kakaoAuthUrl =
    "https://kauth.kakao.com/oauth/authorize" +
    `?client_id=${kakaoClientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&state=${encodeURIComponent(state)}`;

  window.location.assign(kakaoAuthUrl);
};


  const handleNaverLogin = () => {
    alert("네이버 로그인 API 연결 예정");
  };

  const styles = {
    page: {
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: 8,
      background: "linear-gradient(135deg, #FFEDD5 0%, #FEF3C7 100%)",
      fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
    },
    card: {
      width: "100%",
      maxWidth: 420,
      background: "#fff",
      border: "none",
      borderRadius: 20,
      padding: "28px 20px 20px",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
    },
    topRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      marginBottom: 16,
    },
    backBtn: {
      position: "absolute",
      left: 0,
      width: 32,
      height: 32,
      borderRadius: "50%",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
      color: "#111",
    },
    topTitle: { fontWeight: 700, fontSize: 14, color: "#111", letterSpacing: "-0.5px" },

    headline: {
      textAlign: "center",
      marginTop: 8,
      marginBottom: 4,
      fontSize: 24,
      fontWeight: 700,
      color: "#111",
      lineHeight: 1.2,
      letterSpacing: "-0.5px",
    },
    headlineOrange: {
      color: "rgb(244, 133, 37)",
      fontSize: 32,
      fontWeight: 600,
    },
    subSmall: {
      textAlign: "center",
      marginBottom: 20,
      fontSize: 12,
      color: "#9ca3af",
      lineHeight: 1.4,
    },

    label: { fontSize: 13, color: "#374151", fontWeight: 600, marginBottom: 8, display: "block" },
    inputWrap: { marginBottom: 14 },
    input: {
      width: "100%",
      height: 44,
      borderRadius: 12,
      border: "1px solid #e5e7eb",
      padding: "0 14px",
      outline: "none",
      fontSize: 13,
      boxSizing: "border-box",
      transition: "all 0.2s",
      backgroundColor: "#f9fafb",
    },

    pwRow: { position: "relative" },
    eyeBtn: {
      position: "absolute",
      right: 12,
      top: "50%",
      transform: "translateY(-50%)",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      fontSize: 16,
      padding: 4,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#9ca3af",
    },

    helpText: {
      marginTop: 6,
      fontSize: 11,
      color: "#f87171",
      textAlign: "right",
      minHeight: 14,
    },

    primaryBtn: {
      width: "100%",
      height: 44,
      borderRadius: 22,
      border: "none",
      background: "linear-gradient(90deg, rgb(244, 133, 37) 0%, rgb(255, 153, 102) 100%)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 14,
      marginTop: 16,
      transition: "all 0.2s",
      boxShadow: "0 4px 12px rgba(244, 133, 37, 0.3)",
    },
    primaryBtnHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 16px rgba(244, 133, 37, 0.4)",
    },

    linkRow: {
      display: "flex",
      justifyContent: "center",
      gap: 16,
      marginTop: 16,
      fontSize: 12,
      color: "#9ca3af",
      alignItems: "center",
    },
    linkBtn: {
      border: "none",
      background: "transparent",
      cursor: "pointer",
      color: "#9ca3af",
      padding: 0,
      fontSize: 12,
      transition: "color 0.2s",
    },
    linkBtnHover: {
      color: "#FF5F33",
    },
    divider: {
      width: "1px",
      height: "16px",
      backgroundColor: "#e5e7eb",
    },

    dividerLine: {
      margin: "16px 0 14px",
      borderTop: "1px solid #e5e7eb",
    },

    // ✅ 소셜 버튼 공통
    socialBtn: {
      width: "100%",
      height: 44,
      borderRadius: 12,
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      fontWeight: 700,
      fontSize: 13,
      marginBottom: 10,
      boxSizing: "border-box",
      transition: "all 0.2s",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    },
    kakaoBtn: {
      background: "#FFE812",
      color: "#333",
    },
    googleBtn: {
      background: "#fff",
      color: "#111",
      border: "1px solid #e5e7eb",
    },
    naverBtn: {
      background: "#00C73C",
      color: "#fff",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* 상단: 뒤로가기 + 로그인 타이틀 */}
        <div style={styles.topRow}>
          <button style={styles.backBtn} onClick={() => navigate(-1)} aria-label="back">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div style={styles.topTitle}>로그인</div>
        </div>

        {/* 헤드라인 */}
        <div style={styles.headline}>
          <span style={styles.headlineOrange}>Festory</span>에
          <br /> 오신걸 환영합니다!
        </div>
        <div style={styles.subSmall}>나만의 죽제 여행을 발견하는 가장 쉬운 앱</div>

        {/* 이메일 */}
        <div style={styles.inputWrap}>
          <label style={styles.label}>아이디(이메일)</label>
          <input
            style={styles.input}
            placeholder="example@festory.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, email: true }))}
          />
          <div style={styles.helpText}>{emailError}</div>
        </div>

        {/* 비밀번호 */}
        <div style={styles.inputWrap}>
          <label style={styles.label}>비밀번호</label>
          <div style={styles.pwRow}>
            <input
              style={{ ...styles.input, paddingRight: 42 }}
              type={showPw ? "text" : "password"}
              placeholder="영문+숫자+특수문자조합 8~16자리"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, pw: true }))}
            />
            <button
              type="button"
              style={styles.eyeBtn}
              onClick={() => setShowPw((v) => !v)}
              aria-label="toggle password"
              title="비밀번호 보기/숨기기"
            >
              {showPw ? "👁" : "👁‍🗨"}
            </button>
          </div>
          <div style={styles.helpText}>{pwError}</div>
        </div>

        {/* 로그인 버튼 */}
        <button
          style={styles.primaryBtn}
          onClick={login}
          onMouseEnter={(e) => Object.assign(e.target.style, styles.primaryBtnHover)}
          onMouseLeave={(e) =>
            Object.assign(e.target.style, {
              transform: "translateY(0)",
              boxShadow: "0 4px 12px rgba(255, 95, 51, 0.3)",
            })
          }
        >
          로그인
        </button>

        {/* 하단 링크 */}
        <div style={styles.linkRow}>
          <button
            style={styles.linkBtn}
            onClick={() => navigate("/find-id")}
            onMouseEnter={(e) => Object.assign(e.target.style, styles.linkBtnHover)}
            onMouseLeave={(e) => Object.assign(e.target.style, { color: "#9ca3af" })}
          >
            아이디 찾기
          </button>
          <div style={styles.divider} />
          <button
            style={styles.linkBtn}
            onClick={() => navigate("/find-password")}
            onMouseEnter={(e) => Object.assign(e.target.style, styles.linkBtnHover)}
            onMouseLeave={(e) => Object.assign(e.target.style, { color: "#9ca3af" })}
          >
            비밀번호 찾기
          </button>
          <div style={styles.divider} />
          <button
            style={styles.linkBtn}
            onClick={() => navigate("/signup")}
            onMouseEnter={(e) => Object.assign(e.target.style, styles.linkBtnHover)}
            onMouseLeave={(e) => Object.assign(e.target.style, { color: "#9ca3af" })}
          >
            회원가입
          </button>
        </div>

        <div style={styles.dividerLine} />

        {/* 소셜 로그인 3개: 카카오 / 구글(커스텀 버튼) / 네이버 */}
        <button
          style={{ ...styles.socialBtn, ...styles.kakaoBtn }}
          onClick={handleKakaoLogin}
          onMouseEnter={(e) => (e.target.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.target.style.opacity = "1")}
        >
          
          🚀 카카오 계정으로 시작하기
        </button>

        <button
          type="button"
          style={{ ...styles.socialBtn, ...styles.googleBtn }}
          onClick={() => googleLogin()}
          onMouseEnter={(e) => (e.target.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.target.style.opacity = "1")}
        >
          {/* 간단한 구글 아이콘(문자) - 원하면 SVG로도 바꿔줄게 */}
          <span style={{ fontWeight: 900 }}>G</span>
          Google 계정으로 로그인
        </button>

        <button
          style={{ ...styles.socialBtn, ...styles.naverBtn }}
          onClick={handleNaverLogin}
          onMouseEnter={(e) => (e.target.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.target.style.opacity = "1")}
        >
          ✓ 네이버 계정으로 시작하기
        </button>
      </div>
    </div>
  );
}

export default Login;

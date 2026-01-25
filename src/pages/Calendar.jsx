import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import festivals from "../data/festivals_with_geo.json";
import useStore from "../store/useStore";

// ✅ FullCalendar 이벤트 텍스트 중앙정렬
const calendarStyles = `
  .fc-event-title {
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
  .fc-daygrid-event {
    padding: 2px 0 !important;
  }
`;

// ✅ 화면에 캘린더(월/주) 항상 표시
// ✅ 로그인 후 구글 캘린더 일정 불러오기
// ✅ 날짜/드래그 선택 → 일정 추가 → Google Calendar에 실제로 insert

function Calendar() {
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const CALENDAR_ID = import.meta.env.VITE_GOOGLE_CALENDAR_ID || "primary";

  // ✅ 일정 추가하려면 readonly 말고 write scope 필요
  // 가장 무난: calendar.events (이벤트 CRUD)
  const SCOPES = "https://www.googleapis.com/auth/calendar.events";

  // ✅ zustand store로 Google 토큰과 축제 pSeq 관리
  const { googleAccessToken, setGoogleAccessToken, selectedFestivalPSeq, clearSelectedFestivalPSeq } = useStore();
  
  const [token, setToken] = useState(googleAccessToken);
  const [tokenClient, setTokenClient] = useState(null);
  const [error, setError] = useState("");
  const [events, setEvents] = useState([]); // FullCalendar용 이벤트 배열
  const [loading, setLoading] = useState(false);

  // 오른쪽 "Upcoming" 패널용 원본(구글 이벤트)
  const [rawEvents, setRawEvents] = useState([]);

  // ✅ 모달 상태 관리
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit" | "delete"
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    description: "",
    startDateTime: "",
    endDateTime: "",
    allDay: false,
  });

  // ✅ 축제 pSeq 입력 상태
  const [festivalPSeq, setFestivalPSeq] = useState("");
  const [showFestivalInput, setShowFestivalInput] = useState(false);

  // ---------- GIS init ----------
  useEffect(() => {
    setError("");

    // ✅ zustand store에서 토큰 가져오기
    if (googleAccessToken) {
      setToken(googleAccessToken);
    }

    // ✅ zustand store에서 selectedFestivalPSeq 읽기 (홈페이지에서 저장한 것)
    if (selectedFestivalPSeq && googleAccessToken) {
      // 토큰이 있으면 자동으로 축제 로드
      setTimeout(() => {
        loadFestivalAndOpen(selectedFestivalPSeq);
        clearSelectedFestivalPSeq(); // 로드 후 삭제
      }, 500);
    }

    if (!CLIENT_ID) {
      setError("VITE_GOOGLE_CLIENT_ID가 없습니다. (.env 확인)");
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      setError("Google Identity Services 로딩이 아직 안 됐습니다. (index.html 스크립트 확인)");
      return;
    }

    const tc = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp) => {
        if (resp?.access_token) {
          setToken(resp.access_token);
          setGoogleAccessToken(resp.access_token);
        } else {
          setError("토큰 발급에 실패했습니다.");
        }
      },
    });

    setTokenClient(tc);
  }, [CLIENT_ID, googleAccessToken, loadFestivalAndOpen, selectedFestivalPSeq, setGoogleAccessToken, clearSelectedFestivalPSeq]);

  // ---------- helpers ----------
  const fmtK = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("ko-KR", { month: "short", day: "2-digit" });
    } catch {
      return "";
    }
  };

  // ✅ 축제 날짜 파싱 함수 (예: "2026. 1. 16. ~ 1. 18. | 10:00~17:00")
  const parseFestivalDate = (dateStr) => {
    try {
      // "2026. 1. 16. ~ 1. 18." 형태 추출
      const match = dateStr.match(/(\d{4})\.\s+(\d{1,2})\.\s+(\d{1,2})\.\s*~\s*(\d{1,2})\.\s+(\d{1,2})\./);
      if (!match) return null;

      const year = parseInt(match[1]);
      const startMonth = parseInt(match[2]);
      const startDay = parseInt(match[3]);
      const endMonth = parseInt(match[4]);
      const endDay = parseInt(match[5]);

      // ✅ 문자열로 직접 생성 (UTC 변환 문제 해결)
      const startDateTime = `${year}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
      const endDateTime = `${year}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

      return {
        startDateTime,
        endDateTime,
      };
    } catch {
      return null;
    }
  };

  // ✅ pSeq로 축제 정보 로드 및 모달 오픈
  const loadFestivalAndOpen = (pSeq) => {
    const festival = festivals.find((f) => String(f.pSeq) === String(pSeq));
    if (!festival) {
      alert("축제를 찾을 수 없습니다.");
      return;
    }

    const dateInfo = parseFestivalDate(festival.date);
    if (!dateInfo) {
      alert("축제 날짜를 파싱할 수 없습니다.");
      return;
    }

    setFormData({
      id: null,
      title: festival.festival_name,
      description: festival.festival_description,
      startDateTime: dateInfo.startDateTime,
      endDateTime: dateInfo.endDateTime,
      allDay: true,
    });
    setModalMode("add");
    setModalOpen(true);
    setFestivalPSeq("");
    setShowFestivalInput(false);
  };

  // ---------- load events from Google ----------
  const fetchEvents = async (timeMinISO, timeMaxISO) => {
    if (!token) return;

    setLoading(true);
    setError("");
    try {
      const url =
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events` +
        `?timeMin=${encodeURIComponent(timeMinISO)}` +
        `&timeMax=${encodeURIComponent(timeMaxISO)}` +
        `&singleEvents=true&orderBy=startTime&maxResults=250` +
        `&fields=items(id,summary,description,start,end)`; // ✅ description 포함

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`events.list 실패 (${res.status}): ${text}`);
      }

      const data = await res.json();
      const items = data.items || [];
      setRawEvents(items);

      // FullCalendar 형식으로 변환
      const fc = items.map((ev) => ({
        id: ev.id,
        title: ev.summary || "(제목 없음)",
        start: ev.start?.dateTime || ev.start?.date,
        end: ev.end?.dateTime || ev.end?.date,
        allDay: !!ev.start?.date, // 종일 이벤트면 date만 옴
        extendedProps: {
          description: ev.description || "", // ✅ description을 extendedProps에 저장
        },
      }));
      setEvents(fc);
    } catch (e) {
      console.error(e);
      setError("캘린더 이벤트를 불러오지 못했습니다. (콘솔 확인)");
    } finally {
      setLoading(false);
    }
  };

  // ---------- insert event to Google ----------
  const insertEvent = async ({ title, description, start, end, allDay }) => {
    if (!token) {
      setError("먼저 Google 로그인을 해주세요.");
      return;
    }

    setError("");
    try {
      // ✅ allDay 이벤트의 경우 end 날짜에 1일 추가 (Google Calendar API는 end date가 exclusive)
      let endDate = end;
      if (allDay && end) {
        const endDateObj = new Date(end);
        endDateObj.setDate(endDateObj.getDate() + 1);
        endDate = endDateObj.toISOString().split("T")[0];
      }

      const body = {
        summary: title,
        description: description || undefined,
        start: allDay
          ? { date: start.slice(0, 10) }
          : { dateTime: new Date(start).toISOString() },
        end: allDay
          ? { date: endDate }
          : { dateTime: new Date(end).toISOString() },
      };

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`events.insert 실패 (${res.status}): ${text}`);
      }

      // 추가 후 현재 뷰 범위 다시 로드가 가장 확실
      // (FullCalendar가 제공하는 info.view.currentStart/end를 이용하려면 ref 쓰면 되는데,
      //  여기서는 간단하게 "이번달 전후" 다시 로드)
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();
      await fetchEvents(timeMin, timeMax);
    } catch (e) {
      console.error(e);
      setError("일정 추가에 실패했습니다. (권한/스코프/캘린더ID 확인)");
    }
  };

  // ---------- update event in Google ----------
  const updateEvent = async (eventId, { title, description, start, end, allDay }) => {
    if (!token) {
      setError("먼저 Google 로그인을 해주세요.");
      return;
    }

    setError("");
    try {
      // ✅ 먼저 기존 이벤트 조회
      const getRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${encodeURIComponent(eventId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!getRes.ok) {
        throw new Error(`이벤트 조회 실패 (${getRes.status})`);
      }

      const existingEvent = await getRes.json();

      // ✅ 필드 업데이트
      // ✅ allDay 이벤트의 경우 end 날짜에 1일 추가
      let endDate = end;
      if (allDay && end) {
        const endDateObj = new Date(end);
        endDateObj.setDate(endDateObj.getDate() + 1);
        endDate = endDateObj.toISOString().split("T")[0];
      }

      const body = {
        ...existingEvent,
        summary: title,
        description: description || undefined,
        start: allDay
          ? { date: start.slice(0, 10) }
          : { dateTime: new Date(start).toISOString() },
        end: allDay
          ? { date: endDate }
          : { dateTime: new Date(end).toISOString() },
      };

      const updateRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${encodeURIComponent(eventId)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!updateRes.ok) {
        const text = await updateRes.text();
        throw new Error(`events.update 실패 (${updateRes.status}): ${text}`);
      }

      // 다시 로드
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();
      await fetchEvents(timeMin, timeMax);
    } catch (e) {
      console.error(e);
      setError("일정 수정에 실패했습니다.");
    }
  };

  // ---------- delete event from Google ----------
  const deleteEvent = async (eventId) => {
    if (!token) {
      setError("먼저 Google 로그인을 해주세요.");
      return;
    }

    if (!window.confirm("정말로 이 일정을 삭제하시겠습니까?")) {
      return;
    }

    setError("");
    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${encodeURIComponent(eventId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`events.delete 실패 (${res.status}): ${text}`);
      }

      // 다시 로드
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();
      await fetchEvents(timeMin, timeMax);
    } catch (e) {
      console.error(e);
      setError("일정 삭제에 실패했습니다.");
    }
  };

  // ---------- auth ----------
  const signIn = () => {
    setError("");
    if (!tokenClient) {
      setError("로그인 준비가 아직 안 됐습니다. 잠시 후 다시 시도하세요.");
      return;
    }
    tokenClient.requestAccessToken({ prompt: "" });
  };

  const signOut = () => {
    setToken(null);
    setEvents([]);
    setRawEvents([]);
  };

  // ---------- upcoming (right panel) ----------
  const upcoming = useMemo(() => {
    return (rawEvents || []).slice(0, 3).map((ev) => {
      const s = ev.start?.dateTime || ev.start?.date;
      const e = ev.end?.dateTime || ev.end?.date;
      const range = s ? `${fmtK(s)}${e ? ` ~ ${fmtK(e)}` : ""}` : "날짜 정보 없음";
      return { id: ev.id, title: ev.summary || "(제목 없음)", date: range, location: ev.location || "" };
    });
  }, [rawEvents]);

  // ---------- styles (기존 유지) ----------
  const styles = {
    container: { display: "flex", minHeight: "100vh", background: "#f9fafb", fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif" },
    header: { position: "fixed", top: 0, left: 0, right: 0, height: 60, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", zIndex: 100 },
    sidebar: { position: "fixed", left: 0, top: 60, width: 220, height: "calc(100vh - 60px)", background: "#fff", borderRight: "1px solid #e5e7eb", padding: 20, overflowY: "auto" },
    main: { marginLeft: 220, marginTop: 60, flex: 1, display: "flex", gap: 20, padding: 20 },
    calendarCard: { flex: 1, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", flexDirection: "column" },
    calendarTopBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #e5e7eb", background: "#fff" },
    calendarBody: { padding: 16, overflowY: "auto", height: "calc(100vh - 120px)" },
    rightPanel: { width: 340, background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflowY: "auto" },
    sidebarSection: { marginBottom: 24 },
    sidebarTitle: { fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 },
    sidebarItem: { fontSize: 13, color: "#374151", padding: "8px 12px", borderRadius: 6, marginBottom: 8, cursor: "pointer", background: "transparent", border: "none", textAlign: "left", width: "100%" },
    sidebarItemActive: { background: "rgb(244,133,37)", color: "#fff", fontWeight: 600 },
    btn: { padding: "10px 12px", background: "linear-gradient(90deg, rgb(244,133,37) 0%, rgb(255,153,102) 100%)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" },
    btnGhost: { padding: "10px 12px", background: "#fff", color: "#111", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" },
    errorBox: { margin: "12px 16px", padding: "10px 12px", borderRadius: 8, background: "#fff1f2", color: "#9f1239", border: "1px solid #fecdd3", fontSize: 13 },
    eventCard: { marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #e5e7eb" },
    eventImage: { width: "100%", height: 160, borderRadius: 8, background: "#f3f4f6", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 },
    note: { fontSize: 12, color: "#6b7280" },
  };

  return (
    <div style={styles.container}>
      <style>{calendarStyles}</style>
      {/* 헤더 */}
      <div style={styles.header}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "rgb(244,133,37)" }}>🎉 Festory</div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {token ? (
            <>
              <button
                style={styles.btnGhost}
                onClick={() => {
                  const now = new Date();
                  const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                  const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();
                  fetchEvents(timeMin, timeMax);
                }}
              >
                새로고침
              </button>
              {/* ✅ 축제 pSeq 입력 버튼 */}
              <button
                style={styles.btnGhost}
                onClick={() => setShowFestivalInput(!showFestivalInput)}
              >
                🎪 축제 추가
              </button>
              <button style={styles.btnGhost} onClick={signOut}>로그아웃</button>
            </>
          ) : (
            <button style={styles.btn} onClick={signIn}>Google로 로그인</button>
          )}
          <button style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18 }}>👤</button>
        </div>
      </div>

      {/* ✅ 축제 pSeq 입력 패널 */}
      {showFestivalInput && token && (
        <div style={{
          position: "fixed",
          top: 70,
          right: 20,
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          zIndex: 500,
          minWidth: 300,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#111827" }}>
            🎪 축제 pSeq 입력
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={festivalPSeq}
              onChange={(e) => setFestivalPSeq(e.target.value)}
              placeholder="축제 pSeq 입력"
              style={{
                flex: 1,
                padding: "10px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 13,
                outline: "none",
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter" && festivalPSeq.trim()) {
                  loadFestivalAndOpen(festivalPSeq);
                }
              }}
            />
            <button
              onClick={() => {
                if (festivalPSeq.trim()) {
                  loadFestivalAndOpen(festivalPSeq);
                }
              }}
              style={{
                ...styles.btn,
                padding: "10px 16px",
              }}
            >
              추가
            </button>
          </div>
        </div>
      )}

      {/* 사이드바 */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarSection}>
          <button style={{ ...styles.sidebarItem, ...styles.sidebarItemActive }}>📅 Festival Calendar</button>
        </div>
        <div style={styles.sidebarSection}>
          <button style={styles.sidebarItem}>⭐ Saved Festivals</button>
        </div>
        <div style={styles.sidebarSection}>
          <div style={styles.sidebarTitle}>FILTER SEARCH</div>
          <button style={styles.sidebarItem}>📍 Location</button>
          <button style={styles.sidebarItem}>🌍 Region</button>
          <button style={styles.sidebarItem}>🎨 Vibe</button>
          <button style={styles.sidebarItem}>🎭 Genres</button>
        </div>
      </div>

      {/* 메인 */}
      <div style={styles.main}>
        {/* ✅ 캘린더 UI */}
        <div style={styles.calendarCard}>
          <div style={styles.calendarTopBar}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>October 2024</div>
            <div style={styles.note}>
              {token ? "📌 날짜를 선택해서 일정 추가 | 일정을 클릭하면 수정/삭제 | 드래그로 이동" : "로그인하면 일정 추가/수정/삭제가 됩니다."}
            </div>
          </div>

          {error ? <div style={styles.errorBox}>{error}</div> : null}

          <div style={styles.calendarBody}>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              height="100%"
              selectable={!!token}       // 로그인해야 선택 가능
              editable={!!token}         // 로그인하면 드래그로 일정 이동 가능
              events={events}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek",
              }}
              // 현재 보이는 달 범위에 맞춰 Google에서 이벤트 불러오기
              datesSet={(info) => {
                if (!token) return;
                // FullCalendar가 제공하는 현재 view 기간
                fetchEvents(info.start.toISOString(), info.end.toISOString());
              }}
              // 날짜/구간 선택 시 일정 추가 모달 열기
              select={(info) => {
                if (!token) return;

                setFormData({
                  id: null,
                  title: "",
                  description: "",
                  startDateTime: info.startStr,
                  endDateTime: info.endStr,
                  allDay: info.allDay,
                });
                setModalMode("add");
                setModalOpen(true);
              }}
              // ✅ 이벤트 클릭 시: 수정 모달 열기
              eventClick={(info) => {
                if (!token) return;

                setFormData({
                  id: info.event.id,
                  title: info.event.title,
                  description: info.event.extendedProps?.description || "",
                  startDateTime: info.event.startStr || info.event.start.toISOString(),
                  endDateTime: info.event.endStr || (info.event.end ? info.event.end.toISOString() : info.event.start.toISOString()),
                  allDay: info.event.allDay,
                });
                setModalMode("edit");
                setModalOpen(true);
              }}
              // ✅ 드래그로 일정 이동/크기 조정 시
              eventDrop={(info) => {
                if (!token) return;

                updateEvent(info.event.id, {
                  title: info.event.title,
                  start: info.event.startStr || info.event.start.toISOString(),
                  end: info.event.endStr || (info.event.end ? info.event.end.toISOString() : info.event.start.toISOString()),
                  allDay: info.event.allDay,
                });
              }}
              // ✅ 크기 조정(resize) 이벤트
              eventResize={(info) => {
                if (!token) return;

                updateEvent(info.event.id, {
                  title: info.event.title,
                  start: info.event.startStr || info.event.start.toISOString(),
                  end: info.event.endStr || (info.event.end ? info.event.end.toISOString() : info.event.start.toISOString()),
                  allDay: info.event.allDay,
                });
              }}
            />

            {!token && (
              <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
                ※ 로그인 전에도 캘린더는 보이지만, Google 캘린더에 저장/동기화는 로그인 후 가능합니다.
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽 패널 */}
        <div style={styles.rightPanel}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 16 }}>
            UPCOMING FESTIVALS
          </div>

          {!token ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              로그인하면 다가오는 일정이 표시됩니다.
            </div>
          ) : loading ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              불러오는 중…
            </div>
          ) : upcoming.length === 0 ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              다가오는 일정이 없습니다.
            </div>
          ) : (
            upcoming.map((ev, idx) => (
              <div key={ev.id} style={styles.eventCard}>
                <div
                  style={{
                    ...styles.eventImage,
                    background: idx === 0 ? "#fff3e0" : idx === 1 ? "#f3e5f5" : "#e0f2f1",
                  }}
                >
                  📌
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 8 }}>
                  {ev.title}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
                  📅 {ev.date}
                </div>
                {ev.location ? (
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                    📍 {ev.location}
                  </div>
                ) : null}
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ ...styles.btn, flex: 1 }}>View Details</button>
                  <button
                    style={{ ...styles.btnGhost, padding: "10px 8px" }}
                    onClick={() => deleteEvent(ev.id)}
                    title="삭제"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ✅ 일정 추가/수정/삭제 모달 */}
      {modalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            padding: 28,
            maxWidth: 450,
            width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif",
          }}>
            {/* 헤더 */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{
                fontSize: 20,
                fontWeight: 700,
                margin: 0,
                color: "#111827",
              }}>
                {modalMode === "add" ? "🎉 새 일정 추가" : "✏️ 일정 수정"}
              </h2>
              <p style={{
                fontSize: 13,
                color: "#9ca3af",
                margin: "4px 0 0 0",
              }}>
                {modalMode === "add" ? "새로운 일정을 추가하세요" : "일정 정보를 수정하세요"}
              </p>
            </div>

            {/* 제목 */}
            <div style={{ marginBottom: 22 }}>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 8,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                제목
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="일정 제목을 입력하세요"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  fontSize: 14,
                  boxSizing: "border-box",
                  outline: "none",
                  transition: "all 0.2s",
                  color: "#111827",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#FF5F33";
                  e.target.style.boxShadow = "0 0 0 3px rgba(255,95,51,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* 설명 */}
            <div style={{ marginBottom: 22 }}>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 8,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="일정에 대한 설명을 추가하세요"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  fontSize: 14,
                  boxSizing: "border-box",
                  outline: "none",
                  minHeight: 80,
                  resize: "vertical",
                  fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif",
                  transition: "all 0.2s",
                  color: "#111827",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#FF5F33";
                  e.target.style.boxShadow = "0 0 0 3px rgba(255,95,51,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* 시작/종료 시간 (2열) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 22 }}>
              {/* 시작 시간 */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 8,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  시작
                </label>
                <input
                  type={formData.allDay ? "date" : "datetime-local"}
                  value={
                    formData.allDay
                      ? formData.startDateTime.split("T")[0]
                      : formData.startDateTime.includes("T")
                      ? formData.startDateTime.slice(0, 16)
                      : ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (formData.allDay) {
                      setFormData({ ...formData, startDateTime: val });
                    } else {
                      setFormData({ ...formData, startDateTime: val + ":00" });
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    fontSize: 13,
                    boxSizing: "border-box",
                    outline: "none",
                    transition: "all 0.2s",
                    color: "#111827",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#FF5F33";
                    e.target.style.boxShadow = "0 0 0 3px rgba(255,95,51,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* 종료 시간 */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 8,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  종료
                </label>
                <input
                  type={formData.allDay ? "date" : "datetime-local"}
                  value={
                    formData.allDay
                      ? formData.endDateTime.split("T")[0]
                      : formData.endDateTime.includes("T")
                      ? formData.endDateTime.slice(0, 16)
                      : ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (formData.allDay) {
                      setFormData({ ...formData, endDateTime: val });
                    } else {
                      setFormData({ ...formData, endDateTime: val + ":00" });
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    fontSize: 13,
                    boxSizing: "border-box",
                    outline: "none",
                    transition: "all 0.2s",
                    color: "#111827",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#FF5F33";
                    e.target.style.boxShadow = "0 0 0 3px rgba(255,95,51,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* 하루종일 토글 */}
            <div style={{
              marginBottom: 28,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              background: "#f9fafb",
              borderRadius: 10,
            }}>
              <input
                type="checkbox"
                id="allDayCheck"
                checked={formData.allDay}
                onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                style={{
                  cursor: "pointer",
                  width: 18,
                  height: 18,
                }}
              />
              <label htmlFor="allDayCheck" style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                cursor: "pointer",
              }}>
                하루종일 일정
              </label>
            </div>

            {/* 버튼 영역 */}
            <div style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
            }}>
              {modalMode === "edit" && (
                <button
                  onClick={() => {
                    deleteEvent(formData.id);
                    setModalOpen(false);
                  }}
                  style={{
                    padding: "11px 18px",
                    border: "1px solid #fee2e2",
                    background: "#fff",
                    color: "#dc2626",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#fef2f2";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#fff";
                  }}
                >
                  🗑️ 삭제
                </button>
              )}
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  padding: "11px 20px",
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  color: "#6b7280",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#fff";
                }}
              >
                취소
              </button>
              <button
                onClick={async () => {
                  if (!formData.title.trim()) {
                    alert("제목을 입력하세요");
                    return;
                  }

                  if (modalMode === "add") {
                    await insertEvent({
                      title: formData.title,
                      description: formData.description,
                      start: formData.startDateTime,
                      end: formData.endDateTime,
                      allDay: formData.allDay,
                    });
                  } else {
                    await updateEvent(formData.id, {
                      title: formData.title,
                      description: formData.description,
                      start: formData.startDateTime,
                      end: formData.endDateTime,
                      allDay: formData.allDay,
                    });
                  }
                  setModalOpen(false);
                }}
                style={{
                  padding: "11px 20px",
                  background: "linear-gradient(90deg, rgb(244,133,37) 0%, rgb(255,153,102) 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(244,133,37,0.3)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 16px rgba(244,133,37,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 12px rgba(244,133,37,0.3)";
                }}
              >
                {modalMode === "add" ? "➕ 추가" : "💾 수정"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;

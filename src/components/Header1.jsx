import { Link, useLocation } from "react-router-dom";
import { Bell, User } from "lucide-react";
import useStore from "../store/useStore";
import { useState, useEffect, useRef } from "react";
import home_logo from "../assets/home_logo.png";

function Header() {
  const location = useLocation();
  const store = useStore();

  const { loginUser, loginType, user, trips } = store;
  const [showNotifications, setShowNotifications] = useState(false);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const notificationRef = useRef(null);

  // 알림 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  // 3일 이내 일정 확인
  useEffect(() => {
    const checkUpcomingTrips = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = trips.filter(trip => {
        const startDate = new Date(trip.start);
        startDate.setHours(0, 0, 0, 0);

        const diffTime = startDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // 0일부터 3일 이내 (오늘, 1일 후, 2일 후, 3일 후)
        return diffDays >= 0 && diffDays <= 3;
      }).map(trip => {
        const startDate = new Date(trip.start);
        startDate.setHours(0, 0, 0, 0);
        const diffTime = startDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          ...trip,
          daysLeft: diffDays
        };
      });

      setUpcomingTrips(upcoming);
    };

    checkUpcomingTrips();
  }, [trips]);

  const getDaysLeftText = (daysLeft) => {
    if (daysLeft === 0) return "오늘";
    if (daysLeft === 1) return "내일";
    return `${daysLeft}일 후`;
  };

  const navItems = [
    { name: "Home", path: "/after_home" },
    { name: "Festival List", path: "/festivals" },
    { name: "Calendar", path: "/calendar" },
    { name: "Plan & Curation", path: "/plancuration" },
    { name: "Review", path: "/review" },
    { name: "My Page", path: "/mypage" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[95%] mx-auto px-6">
        {/* 🔑 핵심: relative */}
        <div className="flex items-center h-16 relative">
          {/* ================= 좌측 ================= */}
          <div className="flex items-center space-x-8">
            {/* 로고 */}
            <Link to="/after_home" className="flex items-center space-x-2">
              <img
                src={home_logo}
                alt="Festory Logo"
                className="h-12 w-auto object-contain"
              />
            </Link>

            {/* 네비게이션 */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-lg font-medium transition-colors ${
                    isActive(item.path)
                      ? "text-orange-600 bg-orange-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* ================= 중앙 ================= */}
          <div className="hidden lg:block ml-auto mr-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for you need"
                className="w-52 px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* ================= 우측 ================= */}
          <div className="flex items-center space-x-2">
            {/* 알림 */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
              </button>

              {/* 알림 드롭다운 */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border-2 border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
                    <h3 className="text-lg font-bold text-gray-900">🔔 알림</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {upcomingTrips.length > 0 ? (
                      upcomingTrips.map((trip) => (
                        <div
                          key={trip.id}
                          className="p-4 border-b border-gray-100 hover:bg-orange-50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">
                              <span className="material-symbols-outlined text-xl">event</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 mb-1">
                                {trip.name} 일정이 얼마 안 남았습니다!!
                              </p>
                              <p className="text-sm text-orange-600 font-semibold">
                                {getDaysLeftText(trip.daysLeft)} 출발 🎉
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {trip.display}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">다가오는 일정이 없습니다</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 프로필 */}
            <Link
              to="/mypage"
              className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white">
                <User className="w-5 h-5" />
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {loginType === "google"
                  ? loginUser && loginUser !== "google"
                    ? loginUser
                    : user?.name || "Google 사용자"
                  : loginType === "local"
                  ? user?.name || loginUser || "회원"
                  : "로그인"}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

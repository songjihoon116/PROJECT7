import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Map from "./pages/Map";
import Calendar from "./pages/Calendar";
import Signup from "./pages/Signup";
import After_Home from "./pages/After_Home";
import OAuthKakaoCallback from "./pages/OAuthKakaoCallback";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to ="/home" />} />
      <Route path="/after_home" element={<After_Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/map" element={<Map />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/oauth/kakao/callback" element={<OAuthKakaoCallback />} />
    </Routes>
  );
}

export default App;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoHouseImage from '../assets/logo_house.png';

export default function LoginPage() {
  // 1. 입력값 관리를 위한 상태(State) 선언
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // 2. 로그인 처리 함수
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // ⭐️ 중요: res.json()을 하기 전에 응답 상태를 먼저 체크합니다.
      if (!res.ok) {
        const errorBody = await res.text(); // json() 대신 text()로 읽기
        console.error("403 에러 상세 내용:", errorBody);
        alert(`서버 응답 오류 (${res.status}): 컨트롤러에 도달하지 못했습니다.`);
        return;
      }

      const data = await res.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('nickname', data.nickname); // 닉네임 추가 저장
      localStorage.setItem('role', data.role || 'USER'); // role 저장
      navigate('/');
    } catch (err) {
      console.error("로그인 에러:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken"); // 저장된 토큰 삭제
    alert("로그아웃 되었습니다.");
    window.location.href = "/login"; // 로그인 페이지로 리다이렉트
  };

  // JSX 예시
  <button onClick={handleLogout}>로그아웃</button>

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img 
              src={logoHouseImage} 
              alt="Home'Scan Logo" 
              className="h-12 w-auto object-contain"
            />
            {/* <span className="text-2xl font-bold text-gray-900">Home'Scan</span> */}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">로그인</h1>
          <p className="text-gray-600">Home'Scan에 오신 것을 환영합니다!</p>
        </div>

        <div className="space-y-4">
          {/* 소셜 로그인 버튼들은 기존과 동일 */}
          <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            {/* SVG 생략 */}
            <span className="text-gray-700 font-medium">Google 계정으로 계속하기</span>
          </button>

          <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-yellow-300 rounded-lg hover:bg-yellow-400 transition-colors">
            <span className="text-gray-900 font-medium">카카오 계정으로 계속하기</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">또는</span></div>
          </div>

          {/* 3. 실제 로그인 폼 */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)} // 입력값 업데이트
                placeholder="name@example.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} // 입력값 업데이트
                placeholder="비밀번호를 입력하세요"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 font-medium transition-colors"
            >
              로그인
            </button>
          </form>

          <div className="text-center space-y-2">
            <Link to="/find-password" title="준비 중인 기능입니다" className="text-sm text-primary-600 hover:text-primary-700">
              비밀번호 찾기
            </Link>
            <div className="text-sm text-gray-600">
              계정이 없으신가요?{' '}
              <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
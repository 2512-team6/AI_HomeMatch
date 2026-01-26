import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoHouseImage from '../assets/logo_house.png';

const Signup = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!privacyAgreed) {
      setError("개인정보 이용 약관에 동의해주세요.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
          nickname,
          privacyAgreed,
          marketingAgreed,
        }),
      });

      if (!response.ok) {
        throw new Error("회원가입 실패");
      }

      alert("회원가입 성공");
      navigate("/login");
    } catch (err) {
      setError("회원가입 중 오류가 발생했습니다.");
      console.error("로그인 에러:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img 
              src={logoHouseImage} 
              alt="Home'Scan Logo" 
              className="h-12 w-auto object-contain"
            />
            {/* <span className="text-2xl font-bold text-gray-900">Home'Scan</span> */}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
          <p className="text-gray-600">Home'Scan에 오신 것을 환영합니다!</p>
        </div>

        <div className="space-y-4">

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}  
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름
              </label>
              <input
                type="name"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                닉네임
              </label>
              <input
                type="nickname"
                placeholder="닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <input
                type="password"
                placeholder="비밀번호를 재입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="privacyAgreed"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  className="mt-1 mr-2 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  required
                />
                <label htmlFor="privacyAgreed" className="text-sm text-gray-700">
                  <span className="text-primary-600 font-medium">[필수]</span> 개인정보 이용 약관에 동의합니다.
                </label>
              </div>
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="marketingAgreed"
                  checked={marketingAgreed}
                  onChange={(e) => setMarketingAgreed(e.target.checked)}
                  className="mt-1 mr-2 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="marketingAgreed" className="text-sm text-gray-700">
                  <span className="text-gray-500">[선택]</span> 마케팅 정보 수신에 동의합니다.
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 font-medium"
            >
              회원가입
            </button>
          </div>

        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      </form>
    </div>
  );
};

export default Signup;

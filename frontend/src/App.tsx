import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import PropertyListPage from './pages/PropertyListPage'
import PropertyDetailPage from './pages/PropertyDetailPage'
import ContractReviewPage from './pages/ContractReviewPage'
import DeedAnalysisPage from './pages/DeedAnalysisPage'
import ResidencyManagementPage from './pages/ResidencyManagementPage'
import MoveOutPage from './pages/MoveOutPage'
import MyPage from './pages/MyPage'
import AdminPage from './pages/AdminPage'
import Layout from './components/Layout'
import Signup from './pages/Signup'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<Layout><HomePage /></Layout>} />
      <Route path="/properties" element={<Layout><PropertyListPage /></Layout>} />
      <Route path="/properties/:id" element={<Layout><PropertyDetailPage /></Layout>} />
      <Route path="/contract/review" element={<Layout><ContractReviewPage /></Layout>} />
      <Route path="/contract/deed" element={<Layout><DeedAnalysisPage /></Layout>} />
      <Route path="/residency" element={<Layout><ResidencyManagementPage /></Layout>} />
      <Route path="/moveout" element={<Layout><MoveOutPage /></Layout>} />
      <Route path="/mypage" element={<Layout><MyPage /></Layout>} />
      <Route path="/admin" element={<Layout><AdminPage /></Layout>} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  )
}

export default App

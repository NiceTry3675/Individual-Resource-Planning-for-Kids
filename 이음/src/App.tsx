import WalletScenario from './scenarios/wallet/WalletScenario';
import ScenarioIndex from './scenarios/ScenarioIndex';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/common/AppShell';
import PhoneFrame from './components/common/PhoneFrame';
import HomePage from './pages/HomePage';
import InboxPage from './pages/InboxPage';
import ApprovalsPage from './pages/ApprovalsPage';
import ProfilePage from './pages/ProfilePage';
import SchedulePage from './pages/SchedulePage';
import VoucherPage from './pages/VoucherPage';
import RadarPage from './pages/RadarPage';
import ApplicationPage from './pages/ApplicationPage';
import DocumentsPage from './pages/DocumentsPage';
import ResumePage from './pages/ResumePage';
import OutputPage from './pages/OutputPage';
import SharePage from './pages/SharePage';
import DemoPage from './pages/DemoPage';
import SummaryPage from './pages/SummaryPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/share/:token" element={<SharePage />} />
        <Route element={<PhoneFrame />}>
          <Route path="/scenarios" element={<ScenarioIndex />} />
          <Route path="/scenarios/wallet" element={<WalletScenario />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/more" element={<Navigate to="/" replace />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/voucher" element={<VoucherPage />} />
            <Route path="/radar" element={<RadarPage />} />
            <Route path="/applications/:id" element={<ApplicationPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/resume" element={<ResumePage />} />
            <Route path="/outputs/:id" element={<OutputPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/summary" element={<SummaryPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

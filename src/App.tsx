import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainMenu from './pages/MainMenu.js';
import HostPage from './pages/HostPage.js';
import ClientPage from './pages/ClientPage.js';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/host" element={<HostPage />} />
        <Route path="/play/:roomCode" element={<ClientPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

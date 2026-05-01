import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ChatApp from './pages/ChatApp';
import VoicePage from './pages/VoicePage';
import LandingNav from './components/LandingNav';
import SpaceBackground from './components/SpaceBackground';
import NeuralHub from './components/NeuralHub';

const App: React.FC = () => {
  return (
    <>
      <SpaceBackground />
      <LandingNav />
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] text-primary font-mono text-[10px] opacity-20">
        ORVIS_SYSTEM_DEBUG_MODE_ACTIVE
      </div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<ChatApp />} />
        <Route path="/voice" element={<VoicePage />} />
      </Routes>
      <NeuralHub />
    </>
  );
};

export default App;

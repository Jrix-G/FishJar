import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Pages/Home.tsx';
import FishRainbow from './Modules/FishingRainbow/FishingRainbow.tsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fish" element={<FishRainbow />} />
      </Routes>
    </Router>
  );
}

export default App;

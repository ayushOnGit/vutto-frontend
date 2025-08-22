import React, { useState } from 'react';
import Navigation from './components/Navigation';
import SettlementConfigDashboard from './components/SettlementConfigDashboard';
import ChallanDatabaseDashboard from './components/ChallanDatabaseDashboard';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<'settlement' | 'database'>('settlement');

  return (
    <div className="App">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      {currentView === 'settlement' ? (
        <SettlementConfigDashboard />
      ) : (
        <ChallanDatabaseDashboard />
      )}
    </div>
  );
}

export default App;
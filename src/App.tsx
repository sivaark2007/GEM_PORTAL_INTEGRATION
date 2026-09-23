/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { RoleSelectionPage } from './components/RoleSelectionPage';
import { BidderSelectionPage } from './components/BidderSelectionPage';
import { OfficerDashboard } from './components/officer/OfficerDashboard';
import { BidderDashboard } from './components/bidder/BidderDashboard';

const AppContent: React.FC = () => {
  const { view } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Header />
      <main className="flex-1">
        {view === 'role-selection' && <RoleSelectionPage />}
        {view === 'bidder-selection' && <BidderSelectionPage />}
        {view === 'officer-dashboard' && <OfficerDashboard />}
        {view === 'bidder-dashboard' && <BidderDashboard />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

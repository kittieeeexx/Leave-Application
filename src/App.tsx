/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ApplyLeave } from './pages/ApplyLeave';
import { LeaveHistory } from './pages/LeaveHistory';
import { Approvals } from './pages/Approvals';
import { AdminPanel } from './pages/AdminPanel';
import { Payroll } from './pages/Payroll';
import { ShiftSwap } from './pages/ShiftSwap';
import { Attendance } from './pages/Attendance';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="apply" element={<ApplyLeave />} />
            <Route path="history" element={<LeaveHistory />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="swap" element={<ShiftSwap />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="payroll" element={<Payroll />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

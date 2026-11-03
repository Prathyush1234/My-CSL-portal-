/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CslHeader } from './components/CslHeader';
import { PortalFrontPage } from './components/PortalFrontPage';
import { PermanentEmployeeSignIn } from './components/PermanentEmployeeSignIn';
import { QuickAccessDashboard } from './components/QuickAccessDashboard';
import { CslCalendarView } from './components/CslCalendarView';
import { CslSalaryCalculator } from './components/CslSalaryCalculator';
import { CslIncomeTaxCalculator } from './components/CslIncomeTaxCalculator';
import { CslAttendanceView } from './components/CslAttendanceView';
import { CslMoneyManagementView } from './components/CslMoneyManagementView';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { NavDrawer } from './components/NavDrawer';
import { CslAdminModal } from './components/CslAdminModal';
import { WeeklyShiftRotationModal } from './components/WeeklyShiftRotationModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { EmployeeCategory, Language } from './types';
import { translations } from './data/translations';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [selectedCategory, setSelectedCategory] = useState<EmployeeCategory>(() => {
    try {
      const savedCat = localStorage.getItem('csl_employee_category');
      if (savedCat === 'contract' || savedCat === 'permanent' || savedCat === 'apprentice' || savedCat === 'vendor') {
        return savedCat as EmployeeCategory;
      }
      const savedProfile = localStorage.getItem('csl_employee_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed?.category) return parsed.category as EmployeeCategory;
      }
    } catch {}
    return 'permanent';
  });

  // When opening the app:
  // If the user has already signed in previously, directly open the Quick Access Dashboard ('dashboard').
  // Only first-time users (not yet signed in) see the front/sign-in page.
  const [currentView, setCurrentView] = useState<'front' | 'signin' | 'dashboard' | 'calendar' | 'salary' | 'attendance' | 'tax' | 'money'>(() => {
    try {
      const isSignedIn = localStorage.getItem('csl_employee_signed_in') === 'true';
      const saved = localStorage.getItem('csl_employee_profile');
      if (isSignedIn) return 'dashboard';
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name?.trim() && parsed?.token?.trim()) {
          return 'dashboard';
        }
      }
    } catch {}
    return 'front';
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isRotationModalOpen, setIsRotationModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    token: string;
    phone: string;
    department: string;
    category?: EmployeeCategory | string;
    joiningDate?: string;
    finishDate?: string;
    contractFinishDate?: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('csl_employee_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.category) {
          parsed.category = localStorage.getItem('csl_employee_category') || 'permanent';
        }
        return parsed;
      }
    } catch {}
    return {
      name: '',
      token: '',
      phone: '',
      department: '',
      category: (localStorage.getItem('csl_employee_category') as EmployeeCategory) || 'permanent',
    };
  });

  // Listen for employee sign out to reset state and return to front login page
  useEffect(() => {
    const handleSignedOut = () => {
      setCurrentUser({
        name: '',
        token: '',
        phone: '',
        department: '',
      });
      navigateToView('front', true);
    };
    window.addEventListener('csl-employee-signed-out', handleSignedOut);
    return () => window.removeEventListener('csl-employee-signed-out', handleSignedOut);
  }, []);

  // Listen for navigation to money management event
  useEffect(() => {
    const handleNavToMoney = () => navigateToView('money');
    window.addEventListener('csl-navigate-to-money', handleNavToMoney);
    return () => window.removeEventListener('csl-navigate-to-money', handleNavToMoney);
  }, []);

  // Track history depth to allow hardware mobile back button to work seamlessly
  const [navStep, setNavStep] = useState(0);

  // Navigate function that pushes browser history state for mobile back button support
  const navigateToView = (nextView: 'front' | 'signin' | 'dashboard' | 'calendar' | 'salary' | 'attendance' | 'tax' | 'money', replace: boolean = false) => {
    if (nextView === currentView) return;
    try {
      const nextStep = replace ? navStep : navStep + 1;
      if (replace) {
        window.history.replaceState({ view: nextView, step: nextStep }, '');
      } else {
        window.history.pushState({ view: nextView, step: nextStep }, '');
        setNavStep(nextStep);
      }
    } catch {}
    setCurrentView(nextView);
  };

  // Dedicated back action that cleanly pops history when available, or transitions to logical parent
  const goBack = (fallbackView?: 'front' | 'signin' | 'dashboard') => {
    if (isDrawerOpen) {
      setIsDrawerOpen(false);
      return;
    }
    if (isAdminModalOpen) {
      setIsAdminModalOpen(false);
      return;
    }

    if (window.history.state && typeof window.history.state.step === 'number' && window.history.state.step > 0) {
      window.history.back();
    } else {
      const target = fallbackView || (() => {
        if (currentView === 'tax' || currentView === 'salary' || currentView === 'calendar' || currentView === 'attendance' || currentView === 'money') {
          return 'dashboard';
        }
        if (currentView === 'dashboard') {
          return 'signin';
        }
        if (currentView === 'signin') {
          return 'front';
        }
        return 'front';
      })();
      navigateToView(target, true);
    }
  };

  // Handle mobile hardware back button and browser back gestures via popstate
  useEffect(() => {
    // Ensure initial entry is in history with step 0
    try {
      if (!window.history.state || !window.history.state.view) {
        window.history.replaceState({ view: currentView, step: 0 }, '');
      }
    } catch {}

    const handlePopState = (event: PopStateEvent) => {
      // 1. If navigation drawer is open, back button simply closes the drawer
      if (isDrawerOpen) {
        setIsDrawerOpen(false);
        return;
      }

      // 2. If admin modal is open, back button closes the modal
      if (isAdminModalOpen) {
        setIsAdminModalOpen(false);
        return;
      }

      // 3. Navigate to previous view from state, or follow clean mobile fallback stack
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
        if (typeof event.state.step === 'number') {
          setNavStep(event.state.step);
        }
      } else {
        setCurrentView((prev) => {
          if (prev === 'tax' || prev === 'salary' || prev === 'calendar' || prev === 'attendance') {
            return 'dashboard';
          }
          if (prev === 'dashboard') {
            return 'signin';
          }
          if (prev === 'signin') {
            return 'front';
          }
          return 'front';
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDrawerOpen, isAdminModalOpen, currentView]);

  // Listen to global open admin modal events (e.g. from CSL Logo triple clicks)
  useEffect(() => {
    const handleOpenAdmin = () => {
      setIsAdminModalOpen(true);
    };
    const handleOpenRotation = () => {
      setIsRotationModalOpen(true);
    };
    window.addEventListener('csl_open_admin_modal', handleOpenAdmin);
    window.addEventListener('csl-open-shift-rotation-modal', handleOpenRotation);
    return () => {
      window.removeEventListener('csl_open_admin_modal', handleOpenAdmin);
      window.removeEventListener('csl-open-shift-rotation-modal', handleOpenRotation);
    };
  }, []);

  const t = translations[language];

  return (
    <div className="min-h-screen bg-[#020d18] flex flex-col text-white selection:bg-teal-600 selection:text-white">
      {/* Mobile Frame Container Mode (Optional toggle on desktop) */}
      <div className={`flex-1 flex flex-col ${isMobileFrame ? 'max-w-md mx-auto my-6 rounded-[36px] overflow-hidden shadow-2xl border-8 border-slate-900 bg-[#020d18]' : 'w-full'}`}>
        {/* Simulated Phone Status Bar when Mobile Frame mode is active */}
        {isMobileFrame && (
          <div className="bg-[#0a1820] text-slate-300 px-6 py-2 flex items-center justify-between text-xs font-semibold select-none border-b border-slate-800">
            <span>6:44</span>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-teal-400">5G</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Top Navigation Bar (Header) with CSL Logo Triple-Click Admin Hook */}
        <CslHeader
          language={language}
          onLanguageChange={setLanguage}
          onToggleMenu={() => {
            try {
              window.history.pushState({ drawer: true, view: currentView }, '');
            } catch {}
            setIsDrawerOpen(true);
          }}
          isMobileFrame={isMobileFrame}
          onToggleFrame={() => setIsMobileFrame(!isMobileFrame)}
          onAvatarClick={() => navigateToView('dashboard')}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          appTitle={t.appTitle}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col justify-start">
          {currentView === 'front' && (
            <PortalFrontPage
              language={language}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onSelectPermanent={() => navigateToView('signin')}
              onSelectContract={() => navigateToView('signin')}
              currentUser={currentUser}
              onContinue={() => {
                if (selectedCategory === 'permanent' || selectedCategory === 'contract') {
                  navigateToView('signin');
                } else {
                  navigateToView('dashboard');
                }
              }}
            />
          )}

          {currentView === 'signin' && (
            <PermanentEmployeeSignIn
              language={language}
              category={selectedCategory}
              currentUser={currentUser}
              onBack={() => goBack('front')}
              onSignInSuccess={(userData) => {
                const userCat = (userData.category || selectedCategory || localStorage.getItem('csl_employee_category') || 'permanent') as EmployeeCategory;
                const userObj = {
                  name: userData.name,
                  token: userData.token,
                  phone: userData.phone,
                  department: userData.department,
                  category: userCat,
                  joiningDate: userData.joiningDate,
                  finishDate: userData.finishDate || userData.contractFinishDate,
                  contractFinishDate: userData.contractFinishDate || userData.finishDate,
                };
                setCurrentUser(userObj);
                setSelectedCategory(userCat);
                try {
                  localStorage.setItem('csl_employee_category', userCat);
                  localStorage.setItem('csl_employee_profile', JSON.stringify(userObj));
                  localStorage.setItem('csl_employee_signed_in', 'true');
                  if (userData.leaves) {
                    const p1Val = userData.leaves.clPhase1 !== undefined ? userData.leaves.clPhase1 : (userData.leaves.clPhase1Total !== undefined ? userData.leaves.clPhase1Total : 6);
                    const p1Total = userData.leaves.clPhase1Total !== undefined ? userData.leaves.clPhase1Total : p1Val;
                    const p2Val = userData.leaves.clPhase2 !== undefined ? userData.leaves.clPhase2 : (userData.leaves.clPhase2Total !== undefined ? userData.leaves.clPhase2Total : 6);
                    const p2Total = userData.leaves.clPhase2Total !== undefined ? userData.leaves.clPhase2Total : p2Val;
                    const totalCl = userData.leaves.clTotal ?? (p1Total + p2Total);
                    const currentCl = userData.leaves.cl ?? (p1Val + p2Val);

                    const balances = {
                      cl: currentCl,
                      clTotal: totalCl,
                      clPhase1: p1Val,
                      clPhase1Total: p1Total,
                      clPhase2: p2Val,
                      clPhase2Total: p2Total,
                      el: userData.leaves.el ?? 30,
                      elTotal: userData.leaves.elTotal ?? userData.leaves.el ?? 30,
                      hpl: userData.leaves.hpl ?? 20,
                      hplTotal: userData.leaves.hplTotal ?? userData.leaves.hpl ?? 20,
                      specialLeave: userData.leaves.specialLeave ?? 15,
                      specialLeaveTotal: userData.leaves.specialLeaveTotal ?? userData.leaves.specialLeave ?? 15,
                      special: userData.leaves.specialLeave ?? 15,
                      rh: userData.leaves.rh ?? 2,
                      rhTotal: userData.leaves.rhTotal ?? 2,
                    };
                    localStorage.setItem('csl_leave_balances_v2', JSON.stringify(balances));
                    window.dispatchEvent(new CustomEvent('csl-leave-balances-updated', { detail: balances }));
                  }
                } catch {}
                navigateToView('dashboard');
              }}
            />
          )}

          {currentView === 'dashboard' && (
            <QuickAccessDashboard
              language={language}
              currentUser={currentUser}
              onBackToSignIn={() => goBack('signin')}
              onOpenCalendar={() => navigateToView('calendar')}
              onOpenSalary={() => navigateToView('salary')}
              onOpenTax={() => navigateToView('tax')}
              onOpenAttendance={() => navigateToView('attendance')}
              onOpenMoney={() => navigateToView('money')}
            />
          )}

          {currentView === 'calendar' && (
            <CslCalendarView
              language={language}
              currentUser={currentUser}
              onBackToQuickAccess={() => goBack('dashboard')}
              onEditProfile={() => navigateToView('signin')}
              onOpenAttendance={() => navigateToView('attendance')}
              onOpenSalary={() => navigateToView('salary')}
            />
          )}

          {currentView === 'salary' && (
            <CslSalaryCalculator
              language={language}
              currentUser={currentUser}
              onBack={() => goBack('dashboard')}
              onOpenAttendance={() => navigateToView('attendance')}
              onOpenCalendar={() => navigateToView('calendar')}
              onOpenTax={() => navigateToView('tax')}
            />
          )}

          {currentView === 'tax' && (
            <CslIncomeTaxCalculator
              language={language}
              currentUser={currentUser}
              onBack={() => goBack('dashboard')}
              onOpenSalary={() => navigateToView('salary')}
              onOpenAttendance={() => navigateToView('attendance')}
              onOpenCalendar={() => navigateToView('calendar')}
            />
          )}

          {currentView === 'attendance' && (
            <CslAttendanceView
              language={language}
              currentUser={currentUser}
              onBackToQuickAccess={() => goBack('dashboard')}
              onOpenSalary={() => navigateToView('salary')}
              onOpenCalendar={() => navigateToView('calendar')}
            />
          )}

          {currentView === 'money' && (
            <CslMoneyManagementView
              language={language}
              currentUser={currentUser}
              onBack={() => goBack('dashboard')}
              onOpenSalary={() => navigateToView('salary')}
              onOpenAttendance={() => navigateToView('attendance')}
              onOpenCalendar={() => navigateToView('calendar')}
            />
          )}
        </main>

        {/* Global Footer Matching Screenshot */}
        <footer className="mt-auto py-3 px-4 text-center text-[11px] text-slate-400 border-t border-[#092231] bg-[#020c15]">
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-1">
            <span>© 2026 Cochin Shipyard Limited • A Govt. of India Undertaking</span>
            <div className="flex items-center gap-3 text-slate-400 text-[11px] font-medium mt-0.5 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => navigateToView('signin')}
                className="hover:text-cyan-300 transition-colors cursor-pointer"
              >
                Login
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => navigateToView('calendar')}
                className="hover:text-cyan-300 transition-colors cursor-pointer"
              >
                Calendar
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => navigateToView('attendance')}
                className="hover:text-cyan-300 transition-colors cursor-pointer"
              >
                Attendance
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => navigateToView('salary')}
                className="hover:text-cyan-300 transition-colors cursor-pointer"
              >
                Salary
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => navigateToView('tax')}
                className="hover:text-cyan-300 transition-colors cursor-pointer font-bold text-teal-300"
              >
                {language === 'ml' ? 'ഇൻകം ടാക്സ്' : 'Income Tax'}
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => navigateToView('money')}
                className="hover:text-amber-300 transition-colors cursor-pointer font-bold text-amber-300"
              >
                {language === 'ml' ? 'മണി മാനേജ്‌മെന്റ്' : 'Money Mgmt'}
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => navigateToView('dashboard')}
                className="hover:text-cyan-300 transition-colors cursor-pointer"
              >
                Quick Access
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Navigation Drawer Menu */}
      <NavDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        language={language}
        onSelectLanguage={setLanguage}
        onNavigate={(view) => navigateToView(view)}
        currentView={currentView === 'signin' ? 'front' : currentView}
      />

      {/* CSL Admin Password Protection Modal (Password: 472544) */}
      <CslAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        language={language}
      />

      {/* Global Weekly Shift Rotation Modal (A2 ⇄ B2) */}
      <WeeklyShiftRotationModal
        isOpen={isRotationModalOpen}
        onClose={() => setIsRotationModalOpen(false)}
        language={language}
      />

      {/* Global Offline / Online Status & Auto-Update Indicator */}
      <OfflineIndicator />
    </div>
  );
}

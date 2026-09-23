import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppRole, AppView, Company, Tender, BidSubmission } from '../types';
import { INITIAL_COMPANIES, INITIAL_TENDERS, INITIAL_SUBMISSIONS } from '../data/dummyData';

interface AppContextType {
  role: AppRole;
  view: AppView;
  selectedCompany: Company | null;
  companies: Company[];
  tenders: Tender[];
  submissions: BidSubmission[];
  selectedTenderId: string;
  selectRole: (role: AppRole) => void;
  selectCompany: (company: Company) => void;
  createCompany: (companyData: Omit<Company, 'id'>) => Company;
  navigateTo: (view: AppView) => void;
  setSelectedTenderId: (tenderId: string) => void;
  submitBid: (tenderId: string, companyId: string, docNames: string[]) => void;
  runVerificationForSubmission: (submissionId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_COMPANIES = 'gem_ai_companies_v1';
const LOCAL_STORAGE_KEY_ROLE = 'gem_ai_role_v1';
const LOCAL_STORAGE_KEY_VIEW = 'gem_ai_view_v1';
const LOCAL_STORAGE_KEY_SELECTED_COMP = 'gem_ai_selected_comp_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_COMPANIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 10) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load companies from localStorage', e);
    }
    return INITIAL_COMPANIES;
  });

  const [role, setRole] = useState<AppRole>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ROLE);
      if (saved === 'officer' || saved === 'bidder') return saved;
    } catch (e) {
      // ignore
    }
    return 'none';
  });

  const [view, setView] = useState<AppView>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_VIEW);
      if (saved && ['role-selection', 'bidder-selection', 'officer-dashboard', 'bidder-dashboard'].includes(saved)) {
        return saved as AppView;
      }
    } catch (e) {
      // ignore
    }
    return 'role-selection';
  });

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SELECTED_COMP);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return INITIAL_COMPANIES[0] || null;
  });

  const [tenders] = useState<Tender[]>(INITIAL_TENDERS);
  const [submissions, setSubmissions] = useState<BidSubmission[]>(INITIAL_SUBMISSIONS);
  const [selectedTenderId, setSelectedTenderId] = useState<string>(INITIAL_TENDERS[0].id);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_COMPANIES, JSON.stringify(companies));
    } catch (e) {
      // ignore
    }
  }, [companies]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_ROLE, role);
      localStorage.setItem(LOCAL_STORAGE_KEY_VIEW, view);
      if (selectedCompany) {
        localStorage.setItem(LOCAL_STORAGE_KEY_SELECTED_COMP, JSON.stringify(selectedCompany));
      }
    } catch (e) {
      // ignore
    }
  }, [role, view, selectedCompany]);

  const selectRole = (newRole: AppRole) => {
    setRole(newRole);
    if (newRole === 'officer') {
      setView('officer-dashboard');
    } else if (newRole === 'bidder') {
      setView('bidder-selection');
    } else {
      setView('role-selection');
    }
  };

  const selectCompany = (company: Company) => {
    setSelectedCompany(company);
    setRole('bidder');
    setView('bidder-dashboard');
  };

  const createCompany = (companyData: Omit<Company, 'id'>): Company => {
    const newCompany: Company = {
      ...companyData,
      id: `comp-${Date.now()}`,
      isCustom: true,
      color: '#0284c7',
      registeredDate: 'Today'
    };
    const updated = [newCompany, ...companies];
    setCompanies(updated);
    return newCompany;
  };

  const navigateTo = (newView: AppView) => {
    setView(newView);
    if (newView === 'role-selection') {
      setRole('none');
    } else if (newView === 'officer-dashboard') {
      setRole('officer');
    } else if (newView === 'bidder-selection' || newView === 'bidder-dashboard') {
      setRole('bidder');
    }
  };

  const submitBid = (tenderId: string, companyId: string, docNames: string[]) => {
    const newSub: BidSubmission = {
      id: `sub-${Date.now()}`,
      tenderId,
      companyId,
      submittedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      status: 'Under Review',
      complianceScore: 85,
      aiVerificationStage: 'Pending',
      documents: docNames.map(name => ({
        name,
        type: 'PDF',
        fileSize: `${(Math.random() * 2 + 1).toFixed(1)} MB`,
        verified: false
      })),
      flags: []
    };
    setSubmissions(prev => [newSub, ...prev]);
  };

  const runVerificationForSubmission = (submissionId: string) => {
    setSubmissions(prev => prev.map(sub => {
      if (sub.id === submissionId) {
        return {
          ...sub,
          aiVerificationStage: 'Completed',
          status: 'Verified',
          complianceScore: Math.floor(Math.random() * 15) + 84,
          documents: sub.documents.map(d => ({ ...d, verified: true }))
        };
      }
      return sub;
    }));
  };

  return (
    <AppContext.Provider
      value={{
        role,
        view,
        selectedCompany,
        companies,
        tenders,
        submissions,
        selectedTenderId,
        selectRole,
        selectCompany,
        createCompany,
        navigateTo,
        setSelectedTenderId,
        submitBid,
        runVerificationForSubmission
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppRole, AppView, Company, Tender, BidSubmission, GemBiddingDocument } from '../types';
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
  submitBid: (tenderId: string, companyId: string, documents: { name: string; size?: string; type?: string; fileContentUrl?: string }[]) => void;
  runVerificationForSubmission: (submissionId: string) => void;
  addTender: (tenderData: Omit<Tender, 'id' | 'appliedBiddersCount'>) => Tender;
  uploadGemBiddingDocument: (tenderId: string, doc: GemBiddingDocument) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_COMPANIES = 'gem_ai_companies_v1';
const LOCAL_STORAGE_KEY_ROLE = 'gem_ai_role_v1';
const LOCAL_STORAGE_KEY_VIEW = 'gem_ai_view_v1';
const LOCAL_STORAGE_KEY_SELECTED_COMP = 'gem_ai_selected_comp_v1';

const viewToPath: Record<AppView, string> = {
  'role-selection': '/',
  'bidder-selection': '/bidder-selection',
  'officer-dashboard': '/officer-dashboard',
  'bidder-dashboard': '/bidder-dashboard'
};

const pathToView = (path: string): AppView => {
  const entry = Object.entries(viewToPath).find(([, route]) => route === path);
  return (entry?.[0] as AppView | undefined) || 'role-selection';
};

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
      const routeView = pathToView(window.location.pathname);
      if (window.location.pathname !== '/') return routeView;
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

  const [tenders, setTenders] = useState<Tender[]>(INITIAL_TENDERS);
  const [submissions, setSubmissions] = useState<BidSubmission[]>(INITIAL_SUBMISSIONS);
  const [selectedTenderId, setSelectedTenderId] = useState<string>(INITIAL_TENDERS[0].id);

  useEffect(() => {
    const handlePopState = () => setView(pathToView(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const updateRoute = (newView: AppView) => {
    const nextPath = viewToPath[newView];
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ view: newView }, '', nextPath);
    }
  };

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
      updateRoute('officer-dashboard');
    } else if (newRole === 'bidder') {
      setView('bidder-selection');
      updateRoute('bidder-selection');
    } else {
      setView('role-selection');
      updateRoute('role-selection');
    }
  };

  const selectCompany = (company: Company) => {
    setSelectedCompany(company);
    setRole('bidder');
    setView('bidder-dashboard');
    updateRoute('bidder-dashboard');
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
    updateRoute(newView);
    if (newView === 'role-selection') {
      setRole('none');
    } else if (newView === 'officer-dashboard') {
      setRole('officer');
    } else if (newView === 'bidder-selection' || newView === 'bidder-dashboard') {
      setRole('bidder');
    }
  };

  const submitBid = (tenderId: string, companyId: string, documents: { name: string; size?: string; type?: string; fileContentUrl?: string }[]) => {
    const newSub: BidSubmission = {
      id: `sub-${Date.now()}`,
      tenderId,
      companyId,
      submittedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      status: 'Under Review',
      complianceScore: 85,
      aiVerificationStage: 'Pending',
      documents: documents.map(document => ({
        name: document.name,
        type: document.type || 'PDF',
        fileSize: document.size || '1.8 MB',
        verified: false,
        fileContentUrl: document.fileContentUrl
      })),
      flags: []
    };
    setSubmissions(prev => [newSub, ...prev]);
    // Update applied bidders count
    setTenders(prev => prev.map(t =>
      t.id === tenderId ? { ...t, appliedBiddersCount: t.appliedBiddersCount + 1 } : t
    ));
  };

  const addTender = (tenderData: Omit<Tender, 'id' | 'appliedBiddersCount'>): Tender => {
    const newTender: Tender = {
      ...tenderData,
      id: tenderData.tenderNumber,
      appliedBiddersCount: 0,
    };
    setTenders(prev => [newTender, ...prev]);
    setSelectedTenderId(newTender.id);
    return newTender;
  };

  const uploadGemBiddingDocument = (tenderId: string, doc: GemBiddingDocument) => {
    setTenders(prev => prev.map(t =>
      t.id === tenderId ? { ...t, gemBiddingDocument: doc } : t
    ));
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
        runVerificationForSubmission,
        addTender,
        uploadGemBiddingDocument
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
    runVerificationForSubmission,
    addTender,
    uploadGemBiddingDocument
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

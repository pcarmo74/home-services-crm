import { create } from 'zustand';

interface AppState {
  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Auth State
  user: any | null;
  setUser: (user: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Selected Items
  selectedJob: string | null;
  setSelectedJob: (jobId: string | null) => void;

  selectedCrew: string | null;
  setSelectedCrew: (crewId: string | null) => void;

  // Filters
  jobStageFilter: string;
  setJobStageFilter: (stage: string) => void;

  serviceTypeFilter: string;
  setServiceTypeFilter: (type: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  user: null,
  setUser: (user) => set({ user }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  selectedJob: null,
  setSelectedJob: (jobId) => set({ selectedJob: jobId }),

  selectedCrew: null,
  setSelectedCrew: (crewId) => set({ selectedCrew: crewId }),

  jobStageFilter: 'all',
  setJobStageFilter: (stage) => set({ jobStageFilter: stage }),

  serviceTypeFilter: 'all',
  setServiceTypeFilter: (type) => set({ serviceTypeFilter: type }),
}));
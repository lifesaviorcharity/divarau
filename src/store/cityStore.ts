import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CityState {
  selectedCity: { id: number; name: string; slug: string } | null;
  setSelectedCity: (city: { id: number; name: string; slug: string } | null) => void;
  isCityModalOpen: boolean;
  openCityModal: () => void;
  closeCityModal: () => void;
}

export const useCityStore = create<CityState>()(
  persist(
    (set) => ({
      selectedCity: null,
      setSelectedCity: (city) => set({ selectedCity: city, isCityModalOpen: false }),
      isCityModalOpen: false,
      openCityModal: () => set({ isCityModalOpen: true }),
      closeCityModal: () => set({ isCityModalOpen: false }),
    }),
    {
      name: "divar-city-storage",
    }
  )
);

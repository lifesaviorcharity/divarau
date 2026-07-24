"use client";

import { useState, useEffect } from "react";
import { useCityStore } from "@/store/cityStore";
interface City {
  id: number;
  name: string;
  slug: string;
}
import { X, Search, MapPin, Check, Loader2 } from "lucide-react";

export default function CitySelector() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedCity, setSelectedCity, closeCityModal } = useCityStore();

  useEffect(() => {
    fetch("/api/cities")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCities(data);
        } else {
          console.error("Invalid cities data", data);
          setCities([]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch cities", err);
        setIsLoading(false);
      });
  }, []);

  const filteredCities = (Array.isArray(cities) ? cities : []).filter((city) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      city.name.toLowerCase().includes(term) ||
      (city.slug && city.slug.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeCityModal}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-l from-primary/5 to-transparent">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <MapPin size={20} className="text-primary" />
            انتخاب شهر
          </h2>
          <button
            onClick={closeCityModal}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="جستجوی شهر..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* City List */}
        <div className="px-3 pb-4 max-h-[350px] overflow-y-auto city-dropdown">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : filteredCities.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              شهری یافت نشد
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {filteredCities.map((city) => {
                const isSelected = selectedCity?.slug === city.slug;
                return (
                  <button
                    key={city.slug}
                    onClick={() => setSelectedCity(city)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{city.name}</span>
                      {city.slug && (
                        <span className={`text-[11px] font-mono dir-ltr ${isSelected ? "text-white/80" : "text-gray-400"}`}>
                          ({city.slug})
                        </span>
                      )}
                    </span>
                    {isSelected && <Check size={16} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

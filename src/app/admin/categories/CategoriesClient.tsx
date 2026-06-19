"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Tag, Save, X, ChevronDown, ChevronUp, Layers } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CategoriesClient({ initialCategories }: { initialCategories: any[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [expandedCats, setExpandedCats] = useState<Record<number, boolean>>({});

  const toggleCat = (id: number) => {
    setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Modals state
  const [catModal, setCatModal] = useState<{ isOpen: boolean; mode: "add" | "edit"; data: any }>({ isOpen: false, mode: "add", data: null });
  const [subModal, setSubModal] = useState<{ isOpen: boolean; mode: "add" | "edit"; data: any; catId?: number }>({ isOpen: false, mode: "add", data: null });

  const refreshData = () => {
    router.refresh();
    // A quick hack to refresh state from server without full reload
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => setCategories(data));
  };

  // --- Category Handlers ---
  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get("name"),
      icon: formData.get("icon"),
      displayOrder: parseInt(formData.get("displayOrder") as string) || 0
    };

    try {
      const url = catModal.mode === "add" ? "/api/admin/categories" : `/api/admin/categories/${catModal.data.id}`;
      const method = catModal.mode === "add" ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      
      if (res.ok) {
        setCatModal({ isOpen: false, mode: "add", data: null });
        refreshData();
      } else {
        alert(resData.error || "خطا در ذخیره دسته‌بندی");
      }
    } catch (e) {
      alert("خطای شبکه");
    }
  };

  const handleDeleteCat = async (id: number) => {
    if (!confirm("آیا از حذف این دسته‌بندی اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        refreshData();
      } else {
        alert(data.error || "خطا در حذف");
      }
    } catch (e) {
      alert("خطای شبکه");
    }
  };

  // --- SubCategory Handlers ---
  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      categoryId: subModal.catId
    };

    try {
      const url = subModal.mode === "add" ? "/api/admin/subcategories" : `/api/admin/subcategories/${subModal.data.id}`;
      const method = subModal.mode === "add" ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      
      if (res.ok) {
        setSubModal({ isOpen: false, mode: "add", data: null });
        refreshData();
      } else {
        alert(resData.error || "خطا در ذخیره زیردسته");
      }
    } catch (e) {
      alert("خطای شبکه");
    }
  };

  const handleDeleteSub = async (id: number) => {
    if (!confirm("آیا از حذف این زیردسته اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/admin/subcategories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        refreshData();
      } else {
        alert(data.error || "خطا در حذف");
      }
    } catch (e) {
      alert("خطای شبکه");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-800">مدیریت دسته‌بندی‌ها</h2>
        <button 
          onClick={() => setCatModal({ isOpen: true, mode: "add", data: null })}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          افزودن دسته‌بندی جدید
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100 shrink-0">
          <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Layers size={18} className="text-primary" />
            ساختار درختی دسته‌بندی‌ها
          </span>
          <span className="text-xs text-gray-500">مجموع: {categories.length} گروه</span>
        </div>

        <div className="divide-y divide-gray-100 overflow-y-auto">
          {categories.map((cat) => (
            <div key={cat.id} className="flex flex-col">
              {/* Category Row */}
              <div 
                className={`flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group ${expandedCats[cat.id] ? 'bg-gray-50/50' : ''}`}
                onClick={() => toggleCat(cat.id)}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <button className="text-gray-400 hover:text-primary transition-colors shrink-0">
                    {expandedCats[cat.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  <span className="text-2xl w-6 sm:w-8 text-center shrink-0">{cat.icon || "📁"}</span>
                  <div className="min-w-0 pr-2">
                    <h3 className="font-bold text-gray-800 text-sm truncate">{cat.name}</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{cat.subCategories?.length || 0} زیردسته | ترتیب: {cat.displayOrder}</p>
                  </div>
                </div>

                {/* Desktop Hover Actions */}
                <div className="hidden sm:flex items-center gap-2 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => setSubModal({ isOpen: true, mode: "add", data: null, catId: cat.id })}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                  >
                    <Plus size={14} /> افزودن زیردسته
                  </button>
                  <div className="h-4 w-px bg-gray-200 mx-1"></div>
                  <button 
                    onClick={() => setCatModal({ isOpen: true, mode: "edit", data: cat })}
                    className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteCat(cat.id)}
                    className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {/* Mobile Always-Visible Actions */}
                <div className="flex sm:hidden items-center gap-1 shrink-0 pl-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setSubModal({ isOpen: true, mode: "add", data: null, catId: cat.id })} className="p-1.5 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"><Plus size={14}/></button>
                  <button onClick={() => setCatModal({ isOpen: true, mode: "edit", data: cat })} className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"><Edit size={14}/></button>
                  <button onClick={() => handleDeleteCat(cat.id)} className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={14}/></button>
                </div>
              </div>

              {/* SubCategories List */}
              {expandedCats[cat.id] && (
                <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-2">
                  {cat.subCategories?.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400">
                      هیچ زیردسته‌ای برای این گروه ثبت نشده است.
                    </div>
                  ) : (
                    <div className="ml-8 md:ml-12 border-r-2 border-gray-200 pr-4 space-y-1 my-2">
                      {cat.subCategories?.map((sub: any) => (
                        <div key={sub.id} className="flex items-center justify-between group py-2.5 px-3 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 hover:shadow-sm transition-all gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Tag size={14} className="text-gray-400 shrink-0" />
                            <span className="text-sm font-semibold text-gray-700 truncate">{sub.name}</span>
                            <span className="hidden sm:inline-block text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-mono mt-0.5 truncate">{sub.slug}</span>
                          </div>
                          
                          {/* Desktop Hover Actions */}
                          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <span className="text-[10px] text-gray-400 ml-3">
                              {sub._count?.jobs || 0} شغل | {sub._count?.ads || 0} آگهی
                            </span>
                            <button 
                              onClick={() => setSubModal({ isOpen: true, mode: "edit", data: sub, catId: cat.id })}
                              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteSub(sub.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Mobile Always-Visible Actions */}
                          <div className="flex sm:hidden items-center gap-1 shrink-0">
                             <button onClick={() => setSubModal({ isOpen: true, mode: "edit", data: sub, catId: cat.id })} className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"><Edit size={14} /></button>
                             <button onClick={() => handleDeleteSub(sub.id)} className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {categories.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              هیچ دسته‌بندی یافت نشد.
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      {catModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                {catModal.mode === "add" ? "افزودن دسته‌بندی" : "ویرایش دسته‌بندی"}
              </h3>
              <button onClick={() => setCatModal({ isOpen: false, mode: "add", data: null })} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveCat} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">نام دسته‌بندی</label>
                  <input type="text" name="name" defaultValue={catModal.data?.name} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">آیکون (ایموجی)</label>
                  <input type="text" name="icon" defaultValue={catModal.data?.icon || "📁"} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">ترتیب نمایش</label>
                  <input type="number" name="displayOrder" defaultValue={catModal.data?.displayOrder || 0} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setCatModal({ isOpen: false, mode: "add", data: null })} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">انصراف</button>
                <button type="submit" className="px-6 py-2 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2">
                  <Save size={16} /> ذخیره
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SubCategory Modal */}
      {subModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                {subModal.mode === "add" ? "افزودن زیردسته" : "ویرایش زیردسته"}
              </h3>
              <button onClick={() => setSubModal({ isOpen: false, mode: "add", data: null })} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveSub} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">نام زیردسته</label>
                  <input type="text" name="name" defaultValue={subModal.data?.name} required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">نام انگلیسی (Slug)</label>
                  <input type="text" name="slug" defaultValue={subModal.data?.slug} required dir="ltr" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-left" placeholder="e.g. general-services" />
                  <p className="text-[10px] text-gray-400 mt-1">این نام در آدرس (URL) استفاده می‌شود و باید یکتا باشد.</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setSubModal({ isOpen: false, mode: "add", data: null })} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">انصراف</button>
                <button type="submit" className="px-6 py-2 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2">
                  <Save size={16} /> ذخیره
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

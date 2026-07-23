"use client";

import { useState } from "react";
import { Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Upload, X, Image as ImageIcon, Calendar, Edit } from "lucide-react";

interface Banner {
  id: number;
  imageUrl: string;
  link: string;
  position: number;
  displayOrder: number;
  displayDuration: number;
  isActive: boolean;
}

import { toJalali } from "@/lib/utils";

export default function BannersClient({ initialBanners }: { initialBanners: any[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBanner, setNewBanner] = useState({ link: "", position: 1, displayDuration: 5, durationDays: 30 });
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [editBannerData, setEditBannerData] = useState({ link: "", position: 1, displayDuration: 5, durationDays: 30, isActive: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const toggleActive = async (id: number) => {
    const banner = banners.find(b => b.id === id);
    if (!banner) return;
    const newStatus = banner.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus === "ACTIVE" })
      });
      if (res.ok) {
        setBanners((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteBanner = async (id: number) => {
    if (confirm("آیا از حذف این بنر اطمینان دارید؟")) {
      try {
        const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
        if (res.ok) {
          setBanners((prev) => prev.filter((b) => b.id !== id));
        } else {
          alert("خطا در حذف بنر.");
        }
      } catch (error) {
        console.error(error);
        alert("خطای شبکه!");
      }
    }
  };

  const handleEditClick = (banner: any) => {
    setEditingBanner(banner);
    setEditBannerData({
      link: banner.link || "",
      position: banner.position,
      displayDuration: banner.displayDuration,
      durationDays: banner.durationDays || 30,
      isActive: banner.status === "ACTIVE"
    });
    setShowAddForm(false);
  };

  const handleUpdateSave = async () => {
    if (!editingBanner) return;
    setIsUploading(true);
    try {
      const res = await fetch(`/api/admin/banners/${editingBanner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editBannerData)
      });
      if (res.ok) {
        setBanners((prev) => prev.map((b) => b.id === editingBanner.id ? { 
          ...b, 
          ...editBannerData, 
          status: editBannerData.isActive ? "ACTIVE" : "INACTIVE" 
        } : b));
        setEditingBanner(null);
        alert("بنر با موفقیت ویرایش شد.");
      } else {
        alert("خطا در بروزرسانی.");
      }
    } catch (error) {
      console.error(error);
      alert("خطای شبکه!");
    } finally {
      setIsUploading(false);
    }
  };

  const moveUp = (id: number) => {
    setBanners((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx <= 0) return prev;
      const newArr = [...prev];
      [newArr[idx - 1], newArr[idx]] = [newArr[idx], newArr[idx - 1]];
      return newArr;
    });
  };

  const moveDown = (id: number) => {
    setBanners((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx >= prev.length - 1) return prev;
      const newArr = [...prev];
      [newArr[idx], newArr[idx + 1]] = [newArr[idx + 1], newArr[idx]];
      return newArr;
    });
  };

  const handleSaveBanner = async () => {
    if (!imageFile) {
      alert("لطفاً تصویر بنر را انتخاب کنید.");
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("link", newBanner.link);
    formData.append("position", newBanner.position.toString());
    formData.append("displayDuration", newBanner.displayDuration.toString());
    formData.append("durationDays", newBanner.durationDays.toString());

    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const createdBanner = await res.json();
        const formatted = {
          id: createdBanner.id,
          title: createdBanner.link ? createdBanner.link.substring(0, 20) : "بنر",
          position: createdBanner.position,
          status: createdBanner.isActive ? "ACTIVE" : "INACTIVE",
          createdAt: createdBanner.createdAt,
          imageUrl: createdBanner.imageUrl,
          link: createdBanner.link,
          displayDuration: createdBanner.displayDuration,
          durationDays: createdBanner.durationDays,
          expiresAt: createdBanner.expiresAt
        };
        setBanners((prev) => [formatted, ...prev]);
        setShowAddForm(false);
        setNewBanner({ link: "", position: 1, displayDuration: 5, durationDays: 30 });
        setImageFile(null);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "خطا در ذخیره بنر.");
      }
    } catch (error) {
      console.error(error);
      alert("خطای شبکه!");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800">مدیریت بنرها</h1>
        <button onClick={() => { setShowAddForm(!showAddForm); setEditingBanner(null); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md">
          <Plus size={16} />
          افزودن بنر جدید
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && !editingBanner && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-scale-in">
          <h3 className="text-sm font-bold text-gray-800 mb-4">بنر جدید</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">تصویر بنر</label>
              <label className="flex items-center justify-center w-full aspect-square border-2 border-dashed border-gray-200 rounded-xl hover:border-primary cursor-pointer transition-colors overflow-hidden relative">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImageFile(e.target.files[0]);
                  }
                }} />
                {imageFile ? (
                  <img src={URL.createObjectURL(imageFile)} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400">
                    <Upload size={24} className="mx-auto mb-1" />
                    <p className="text-xs">انتخاب تصویر</p>
                  </div>
                )}
              </label>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">لینک مقصد</label>
                <input type="url" value={newBanner.link} onChange={(e) => setNewBanner({ ...newBanner, link: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-left dir-ltr" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">موقعیت</label>
                  <select value={newBanner.position} onChange={(e) => setNewBanner({ ...newBanner, position: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value={1}>جایگاه ۱ (اصلی)</option>
                    <option value={2}>جایگاه ۲</option>
                    <option value={3}>جایگاه ۳</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">مدت نمایش (ثانیه)</label>
                  <input type="number" value={newBanner.displayDuration} min={2} max={15}
                    onChange={(e) => setNewBanner({ ...newBanner, displayDuration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">انقضا (روز)</label>
                  <input type="number" value={newBanner.durationDays} min={1} max={365}
                    onChange={(e) => setNewBanner({ ...newBanner, durationDays: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveBanner} disabled={isUploading} className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50">
              {isUploading ? "در حال ذخیره..." : "ذخیره بنر"}
            </button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-gray-200 text-sm rounded-xl hover:bg-gray-50 transition-colors">لغو</button>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editingBanner && (
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 animate-scale-in w-full max-w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-800">ویرایش بنر</h3>
            <button onClick={() => setEditingBanner(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">لینک مقصد</label>
              <input type="url" value={editBannerData.link} onChange={(e) => setEditBannerData({ ...editBannerData, link: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-left dir-ltr" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">موقعیت</label>
                <select value={editBannerData.position} onChange={(e) => setEditBannerData({ ...editBannerData, position: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value={1}>جایگاه ۱ (اصلی)</option>
                  <option value={2}>جایگاه ۲</option>
                  <option value={3}>جایگاه ۳</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">مدت نمایش (ثانیه)</label>
                <input type="number" value={editBannerData.displayDuration} min={2} max={15}
                  onChange={(e) => setEditBannerData({ ...editBannerData, displayDuration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">انقضا (روز)</label>
                <input type="number" value={editBannerData.durationDays} min={1} max={365}
                  onChange={(e) => setEditBannerData({ ...editBannerData, durationDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editBannerData.isActive} onChange={(e) => setEditBannerData({ ...editBannerData, isActive: e.target.checked })} className="rounded text-primary focus:ring-primary/20 w-4 h-4" />
                  <span className="text-xs font-semibold text-gray-700">فعال</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleUpdateSave} disabled={isUploading} className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
              {isUploading ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
            <button onClick={() => setEditingBanner(null)} className="px-4 py-2 border border-gray-200 text-sm rounded-xl hover:bg-gray-50 transition-colors">لغو</button>
          </div>
        </div>
      )}

      {/* Banners List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full overflow-hidden">
        <div className="w-full" style={{ overflowX: 'scroll', WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full min-w-[900px] text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">#</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">پیش‌نمایش</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">لینک</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">جایگاه</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">مدت (ثانیه)</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">انقضا (روز)</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">وضعیت</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner, idx) => (
                <tr key={banner.id} className={`border-b border-gray-50 transition-colors ${banner.status === "ACTIVE" ? "hover:bg-gray-50/50" : "bg-gray-50/30 opacity-60"}`}>
                  <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="w-28 h-10 rounded-lg bg-gradient-to-l from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden">
                      {banner.imageUrl ? (
                        <img src={banner.imageUrl} alt="banner" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={16} className="text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate font-mono" dir="ltr">
                    {banner.link || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">جایگاه {banner.position}</td>
                  <td className="px-4 py-3 text-gray-600">{banner.displayDuration}</td>
                  <td className="px-4 py-3 text-gray-600">{banner.durationDays || 30}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] font-semibold rounded-lg ${banner.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {banner.status === "ACTIVE" ? "فعال" : "غیرفعال"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => moveUp(banner.id)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="بالا">
                        <ArrowUp size={14} />
                      </button>
                      <button onClick={() => moveDown(banner.id)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="پایین">
                        <ArrowDown size={14} />
                      </button>
                      <button onClick={() => toggleActive(banner.id)}
                        className={`p-1.5 rounded-lg ${banner.status === "ACTIVE" ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
                        title={banner.status === "ACTIVE" ? "غیرفعال" : "فعال"}>
                        {banner.status === "ACTIVE" ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => handleEditClick(banner)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="ویرایش">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => deleteBanner(banner.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="حذف">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

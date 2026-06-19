"use client";

import { useState } from "react";
import { ChevronLeft, Mail, Phone, MessageCircle, Send, Headphones } from "lucide-react";

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (!name || !email || !subject || !message) {
      alert("لطفاً تمامی فیلدها را پر کنید.");
      return;
    }
    alert("پیام شما با موفقیت ارسال شد. تیم پشتیبانی در اسرع وقت پاسخ شما را خواهد داد.");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <a href="/" className="hover:text-primary">خانه</a>
          <ChevronLeft size={12} />
          <span className="text-gray-700">پشتیبانی</span>
        </div>

        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <Headphones size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black gradient-text mb-2">پشتیبانی</h1>
          <p className="text-sm text-gray-500">ما اینجاییم تا به شما کمک کنیم. از طریق راه‌های زیر با ما در ارتباط باشید.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {/* Contact Cards */}
          {[
            {
              icon: <Mail size={24} />,
              title: "ایمیل",
              desc: "info@auir.com.au",
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              icon: <Phone size={24} />,
              title: "تلفن",
              desc: "+61 000 000 000",
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              icon: <MessageCircle size={24} />,
              title: "چت آنلاین",
              desc: "پشتیبانی در ساعات اداری",
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
          ].map((card, i) => (
            <div
              key={i}
              className={`${card.bg} rounded-2xl p-6 text-center card-hover animate-fade-in`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`${card.color} flex justify-center mb-3`}>{card.icon}</div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">{card.title}</h3>
              <p className="text-xs text-gray-500">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 animate-fade-in">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Send size={20} className="text-primary" />
            ارسال پیام
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">نام *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="نام خود را وارد کنید"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">ایمیل *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="ایمیل خود را وارد کنید"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left dir-ltr" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">موضوع *</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="موضوع پیام"
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">متن پیام *</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="پیام خود را بنویسید..."
              className="w-full h-36 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
          </div>

          <button onClick={handleSubmit}
            className="px-8 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
            ارسال پیام
          </button>
        </div>
      </div>
    </div>
  );
}

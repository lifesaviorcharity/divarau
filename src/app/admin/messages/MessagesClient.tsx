"use client";

import { useState } from "react";
import { Search, MessageSquare, LifeBuoy, Send, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface Ticket {
  id: number;
  user: string;
  mobile: string;
  subject: string;
  message: string;
  status: "OPEN" | "REPLIED" | "CLOSED";
  statusLabel: string;
  statusColor: string;
  createdAt: string;
  replies: { sender: string; message: string; date: string }[];
}

import { toJalali } from "@/lib/utils";

export default function MessagesClient({ initialTickets }: { initialTickets: any[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredTickets = tickets.filter(
    (t) => statusFilter === "ALL" || t.status === statusFilter
  );

  const handleReply = () => {
    if (!replyText.trim() || !selectedTicket) return;
    const updated = tickets.map((t) => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: "REPLIED" as const,
          statusLabel: "پاسخ داده شده",
          statusColor: "bg-blue-100 text-blue-700",
          replies: [...(t.replies || []), { sender: "admin", message: replyText, date: "الان" }],
        };
      }
      return t;
    });
    setTickets(updated);
    setSelectedTicket(updated.find((t) => t.id === selectedTicket.id) || null);
    setReplyText("");
  };

  const closeTicket = (id: number) => {
    setTickets((prev) =>
      prev.map((t) => t.id === id ? { ...t, status: "CLOSED" as const, statusLabel: "بسته شده", statusColor: "bg-gray-100 text-gray-600" } : t)
    );
    if (selectedTicket?.id === id) setSelectedTicket(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800">پیام‌ها و تیکت‌ها</h1>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full">
            {tickets.filter((t) => t.status === "OPEN").length} باز
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1 space-y-3">
          {/* Filter */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="ALL">همه تیکت‌ها</option>
            <option value="OPEN">باز</option>
            <option value="REPLIED">پاسخ داده شده</option>
            <option value="CLOSED">بسته شده</option>
          </select>

          {filteredTickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`w-full text-right bg-white rounded-xl border p-4 transition-all hover:shadow-md ${
                selectedTicket?.id === ticket.id ? "border-primary shadow-md" : "border-gray-100"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg ${ticket.status === 'OPEN' ? 'bg-red-100 text-red-700' : ticket.status === 'CLOSED' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                  {ticket.status === 'OPEN' ? 'باز' : ticket.status === 'CLOSED' ? 'بسته' : 'پاسخ داده شده'}
                </span>
                <h3 className="text-sm font-bold text-gray-800">{ticket.subject}</h3>
              </div>
              <p className="text-xs text-gray-500 line-clamp-1 text-right">{ticket.lastMessage}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-gray-400">{toJalali(new Date(ticket.updatedAt))}</span>
                <span className="text-[10px] text-gray-400">{ticket.user}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedTicket.status !== "CLOSED" && (
                    <button onClick={() => closeTicket(selectedTicket.id)}
                      className="px-3 py-1 text-xs font-bold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                      بستن تیکت
                    </button>
                  )}
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg ${selectedTicket.status === 'OPEN' ? 'bg-red-100 text-red-700' : selectedTicket.status === 'CLOSED' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                    {selectedTicket.status === 'OPEN' ? 'باز' : selectedTicket.status === 'CLOSED' ? 'بسته' : 'پاسخ داده شده'}
                  </span>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-bold text-gray-800">{selectedTicket.subject}</h3>
                  <p className="text-[10px] text-gray-400">{selectedTicket.user}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                {/* Original message */}
                <div className="flex justify-end">
                  <div className="bg-gray-100 rounded-2xl rounded-tr-sm p-4 max-w-[80%]">
                    <p className="text-sm text-gray-800">{selectedTicket.lastMessage}</p>
                    <p className="text-[10px] text-gray-400 mt-2">{selectedTicket.user} — {toJalali(new Date(selectedTicket.createdAt))}</p>
                  </div>
                </div>

                {/* Replies */}
                {(selectedTicket.replies || []).map((reply: any, i: number) => (
                  <div key={i} className={`flex ${reply.sender === "admin" ? "justify-start" : "justify-end"}`}>
                    <div className={`rounded-2xl p-4 max-w-[80%] ${
                      reply.sender === "admin"
                        ? "bg-primary/10 rounded-tl-sm"
                        : "bg-gray-100 rounded-tr-sm"
                    }`}>
                      <p className="text-sm text-gray-800">{reply.message}</p>
                      <p className="text-[10px] text-gray-400 mt-2">
                        {reply.sender === "admin" ? "مدیر" : selectedTicket.user} — {reply.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              {selectedTicket.status !== "CLOSED" && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-end gap-3">
                  <button onClick={handleReply} disabled={!replyText.trim()}
                    className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <Send size={18} />
                  </button>
                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                    placeholder="پاسخ خود را بنویسید..."
                    className="flex-1 px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-20" />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">تیکتی انتخاب نشده</p>
              <p className="text-xs mt-1">یک تیکت از لیست سمت راست انتخاب کنید</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

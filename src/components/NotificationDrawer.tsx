import React from 'react';
import { X, CheckCircle2, Clock, AlertCircle, Bell, Sparkles } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext.tsx';

export const NotificationDrawer: React.FC = () => {
  const { notifications, isDrawerOpen, setIsDrawerOpen, markAsRead, markAllAsRead } = useNotifications();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsDrawerOpen(false)}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                <p className="text-[11px] text-slate-500">Live order & kitchen updates</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notifications.some((n) => !n.readAt) && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs text-slate-400 mt-1">Updates on your food orders will appear here</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.readAt;
                return (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isUnread
                        ? 'bg-orange-50/70 border-orange-200 shadow-xs'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />}
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

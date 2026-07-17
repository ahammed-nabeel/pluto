"use client";
import PlutoLogo from "@/components/ui/PlutoLogo";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, User, Settings, ChevronDown, Menu, LayoutDashboard, Columns, BarChart3, ShieldCheck, Bell, Clock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface HeaderProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
  };
}

// Breadcrumb from path
function useBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const labels: Record<string, string> = {
    boards: "Boards",
    dashboard: "Dashboard",
    reports: "Reports",
    profile: "Profile",
    admin: "Admin",
    users: "Users",
    settings: "Settings",
  };
  return segments.map((s) => labels[s] ?? s);
}

export function Header({ user }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [lastReadTime, setLastReadTime] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data);

        // Check if there are any updates newer than the last read time
        const storedLastRead = localStorage.getItem(`last_read_notifications_${user.id}`);
        setLastReadTime(storedLastRead);
        if (data.data.length > 0) {
          if (!storedLastRead) {
            setHasUnread(true);
          } else {
            const hasNew = data.data.some(
              (n: any) => new Date(n.timestamp).getTime() > new Date(storedLastRead).getTime()
            );
            setHasUnread(hasNew);
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 45 seconds
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, [user.id]);

  const handleMarkAsRead = () => {
    const nowStr = new Date().toISOString();
    localStorage.setItem(`last_read_notifications_${user.id}`, nowStr);
    setLastReadTime(nowStr);
    setHasUnread(false);
  };

  const breadcrumb = useBreadcrumb();
  const pathname = usePathname();

  // Define top level navigation links
  const navItems = [
    { href: "/boards", label: "Boards", icon: Columns },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/reports", label: "Reports", icon: BarChart3 },
  ];

  if (user.role === "super_admin") {
    navItems.push({ href: "/admin/users", label: "Users", icon: ShieldCheck });
  }

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-30">
      {/* Left — logo/mobile menu + breadcrumb */}
      <div className="flex items-center gap-6 min-w-0">
        <Link href="/boards">
          <PlutoLogo size="sm" textClassName="text-slate-900 hidden md:inline" />
        </Link>

        {/* Breadcrumb */}
        <nav className="hidden lg:flex items-center gap-1.5 text-sm border-l border-slate-200 pl-4">
          {breadcrumb.map((seg, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-300">/</span>}
              <span className={cn(
                i === breadcrumb.length - 1
                  ? "text-slate-900 font-semibold"
                  : "text-slate-400"
              )}>
                {seg}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Middle — Horizontal Navigation Links */}
      <nav className="flex items-center gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right — user and notification menus */}
      <div className="flex items-center gap-2">
        {/* Notifications Icon Button */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen((v) => !v);
              if (!notificationsOpen) {
                handleMarkAsRead();
              }
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-fade-in max-h-[400px] overflow-y-auto flex flex-col">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">Notifications</span>
                  <button
                    onClick={() => {
                      setNotifications([]);
                      setHasUnread(false);
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-400 text-xs">
                      No notifications or reminders
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const isNew = lastReadTime ? new Date(n.timestamp).getTime() > new Date(lastReadTime).getTime() : true;
                      return (
                        <Link
                          key={n.id}
                          href={n.link}
                          onClick={() => setNotificationsOpen(false)}
                          className={cn(
                            "block px-4 py-3 hover:bg-slate-50 transition-colors text-left",
                            isNew && "bg-blue-50/30"
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            {n.type === "reminder" ? (
                              <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 leading-tight">{n.title}</p>
                              <p className="text-xs text-slate-650 mt-0.5 leading-snug break-words">{n.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-slate-200 transition-all"
            id="user-menu-button"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <Avatar
              src={user.image}
              name={user.name ?? user.email ?? "User"}
              size="sm"
              className="rounded-full border border-slate-200"
            />
          </button>

        {/* Dropdown */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-fade-in">
              {/* User info */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Edit Profile
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Settings
                </Link>
              </div>

              <div className="border-t border-slate-100 py-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  </header>
);
}

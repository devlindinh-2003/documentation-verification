"use client";

import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import { usePathname } from "next/navigation";
import { LogOut, ShieldCheck, User } from "lucide-react";
import { NotificationBell } from "./notifications/NotificationBell";

export function Header() {
  const { isAuthenticated, user, role, logout } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated || pathname === "/login") return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex-1 flex items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-all duration-300">
              <ShieldCheck className="text-white" size={20} />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900 hidden sm:block">
              VeriFlow
            </span>
          </Link>
        </div>

        {/* Right: User Role + Logout */}
        <div className="flex-1 flex items-center justify-end gap-3 sm:gap-6">
          {role === "seller" && <NotificationBell />}

          <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200/60">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="capitalize text-sm font-bold text-slate-900 leading-none">
                  {user?.email?.split("@")[0]}
                </span>
              </div>
              <div className="relative">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shadow-sm ${
                    role === "admin"
                      ? "bg-amber-50 border-amber-200 text-amber-600"
                      : "bg-blue-50 border-blue-200 text-blue-600"
                  }`}
                >
                  <User size={18} strokeWidth={2.5} />
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                    role === "admin" ? "bg-amber-500" : "bg-blue-500"
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 text-sm font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border border-transparent hover:border-red-100 group"
            title="Logout"
          >
            <LogOut
              size={18}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

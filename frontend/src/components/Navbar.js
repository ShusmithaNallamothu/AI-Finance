import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sprout, LayoutDashboard, MessageCircle, User, LogOut, ChevronDown } from "lucide-react";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/chat", label: "Chat", icon: MessageCircle },
  ];

  return (
    <nav data-testid="navbar" className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-stone-100">
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex items-center justify-between h-14">
        <button
          data-testid="navbar-logo"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center">
            <Sprout className="w-4 h-4 text-white" />
          </div>
          <span className="font-nunito font-bold text-lg text-stone-800 hidden sm:inline">Bloom</span>
        </button>

        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Button
              key={link.path}
              data-testid={`nav-${link.label.toLowerCase()}`}
              variant="ghost"
              onClick={() => navigate(link.path)}
              className={`rounded-full px-4 h-9 text-sm font-medium transition-all ${
                location.pathname === link.path
                  ? "bg-rose-50 text-primary"
                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
              }`}
            >
              <link.icon className="w-4 h-4 mr-1.5" />
              {link.label}
            </Button>
          ))}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              data-testid="nav-user-menu"
              variant="ghost"
              className="rounded-full h-9 px-3 text-sm font-medium text-stone-600 hover:bg-stone-50 gap-1.5"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
              <span className="hidden sm:inline max-w-[100px] truncate">{user?.name}</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl w-48">
            <DropdownMenuItem className="text-sm text-stone-500 cursor-default">
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid="nav-logout"
              onClick={logout}
              className="text-sm text-red-500 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

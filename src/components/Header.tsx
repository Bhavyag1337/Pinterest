import { Search, Bell, MessageCircle, ChevronDown, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1 shrink-0">
          <img src={logo} alt="Pinterest" className="w-8 h-8" />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link to="/">
            <Button variant="ghost" className="rounded-full font-semibold">
              Home
            </Button>
          </Link>
          <Button variant="ghost" className="rounded-full font-semibold">
            Explore
          </Button>
          <Button variant="ghost" className="rounded-full font-semibold">
            Create
            <ChevronDown className="w-4 h-4" />
          </Button>
        </nav>

        {/* Search */}
        <div className="flex-1 mx-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <SearchInput
              placeholder="Search for ideas"
              className="pl-12"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          <Button variant="icon" size="icon" className="hidden sm:flex">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="icon" size="icon" className="hidden sm:flex">
            <MessageCircle className="w-5 h-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="icon" size="icon" className="relative">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{user?.name || "User"}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-destructive">
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

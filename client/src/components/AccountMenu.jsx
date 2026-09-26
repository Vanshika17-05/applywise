import { useNavigate, useLocation } from "react-router-dom";
import { ChevronUp, CircleUserRound, LogOut, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function AccountMenu({ user, onLogout, mobile = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const firstName = user.name.trim().split(/\s+/)[0] || "Account";
  const accountPage = location.pathname === "/profile" || location.pathname === "/settings";
  const photo = user.photoUrl || user.profilePhoto;
  const avatar = photo
    ? <img src={photo} alt="" className="size-full rounded-full object-cover" />
    : firstName[0]?.toUpperCase();

  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {mobile
        ? <button aria-label={`Open account menu for ${user.name}`} title={user.name} className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--accent-border)] bg-accent-soft text-sm font-bold text-accent focus-visible:outline-2 focus-visible:outline-[var(--accent)]">{avatar}</button>
        : <button aria-label={`Open account menu for ${user.name}`} title={user.name} className={`mt-5 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-[var(--accent-muted)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${accountPage ? "bg-accent-soft text-accent" : "text-subtle hover:text-[var(--text)]"}`}><span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft font-bold text-accent">{avatar}</span><span className="min-w-0 flex-1 truncate font-medium">{firstName}</span><ChevronUp size={15} aria-hidden="true" /></button>}
    </DropdownMenuTrigger>
    <DropdownMenuContent side={mobile ? "bottom" : "top"} align={mobile ? "end" : "start"} className="w-[214px]">
      <DropdownMenuLabel><p className="break-words text-sm font-semibold text-main">{user.name}</p><p className="truncate text-xs font-normal text-subtle" title={user.email}>{user.email}</p></DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => navigate("/profile")} className={location.pathname === "/profile" ? "bg-accent-soft text-accent" : ""}><CircleUserRound size={16} /> Profile</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => navigate("/settings")} className={location.pathname === "/settings" ? "bg-accent-soft text-accent" : ""}><Settings size={16} /> Settings</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onLogout} className="logout-menu-item"><LogOut size={16} /> Logout</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}

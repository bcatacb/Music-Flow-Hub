import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Mic2, 
  Piano, 
  Music, 
  Radio, 
  BarChart3,
  Upload,
  LogOut,
  Settings,
  Bell
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/songs", label: "Songs", icon: Music },
  { href: "/lyrics", label: "Lyrics", icon: Mic2 },
  { href: "/instrumentals", label: "Beats", icon: Piano },
  { href: "/releases", label: "Releases", icon: Radio },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/import", label: "Import", icon: Upload },
];

export function StudioLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex w-full overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col z-20 flex-shrink-0 hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <Music className="h-6 w-6" />
            <span className="font-display font-bold text-xl tracking-tight text-foreground">
              Sonic<span className="text-primary">Studio</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link key={item.href} href={item.href} className="block relative">
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group z-10 relative",
                  isActive 
                    ? "text-primary-foreground" 
                    : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  {item.label}
                </div>
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary rounded-xl z-0 shadow-neon"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
            Settings
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-sidebar-foreground hover:text-destructive transition-colors mt-1">
            <LogOut className="h-5 w-5 text-muted-foreground" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 z-20 flex-shrink-0">
          <div className="flex items-center md:hidden">
            <Music className="h-6 w-6 text-primary mr-2" />
            <span className="font-display font-bold text-lg">SonicStudio</span>
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            <button className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-neon cursor-pointer">
              PR
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto h-full"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

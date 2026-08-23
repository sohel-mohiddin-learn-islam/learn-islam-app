import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Home, BookOpen, Hand, Compass, Hash, Menu, X, BookText, Scroll, Star, Users, Calendar, Heart, MessageCircle, Flame, Info, Moon, Sun } from "lucide-react";

const bottomNav = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/prophets", icon: BookOpen, label: "Prophets" },
  { href: "/surahs", icon: BookText, label: "Qur'an" },
  { href: "/duas", icon: Hand, label: "Duas" },
  { href: "/more", icon: Menu, label: "More" },
];

const allNav = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/prophets", icon: BookOpen, label: "Prophet Stories" },
  { href: "/surahs", icon: BookText, label: "Qur'an Surahs" },
  { href: "/asmaul-husna", icon: Star, label: "99 Names of Allah" },
  { href: "/hadiths", icon: Scroll, label: "Hadith Collection" },
  { href: "/duas", icon: Hand, label: "Dua Library" },
  { href: "/karbala", icon: Flame, label: "Karbala" },
  { href: "/sahabah", icon: Users, label: "Companions" },
  { href: "/calendar", icon: Calendar, label: "Islamic Calendar" },
  { href: "/prayer-guide", icon: Heart, label: "Prayer Guide" },
  { href: "/kids", icon: Heart, label: "Kids Zone" },
  { href: "/quran-values", icon: BookOpen, label: "Quran Values" },
  { href: "/about", icon: Info, label: "About" },
  { href: "/reels", icon: Flame, label: "Reels" },
{ href:"/contact", icon: MessageCircle, label:"Contact" },
{ href:"/terms", icon: Info, label:"Terms" },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [showMore, setShowMore] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">☪️</span>
          <span className="font-serif font-bold text-primary text-lg">Learn Islam</span>
        </div>
        <div className="flex items-center gap-2">
          <select value={language} onChange={e=>setLanguage(e.target.value as any)}
            className="bg-muted text-foreground text-xs rounded-lg px-2 py-1 border border-border">
            <option value="en">EN</option>
            <option value="roman-hindi">हिं</option>
            <option value="roman-telugu">తె</option>
            <option value="ar">عر</option>
          </select>
          <button onClick={toggleTheme} className="p-2 rounded-full bg-muted">
          {isDark ? <Sun className="w-5 h-5 text-yellow-400"/> : <Moon className="w-5 h-5 text-primary"/>}
        </button>
          {user ? (
  <button onClick={() => setLocation('/account')} className="p-2 rounded-full bg-muted overflow-hidden">
    {user.photoURL ? (
      <img src={user.photoURL} className="w-5 h-5 rounded-full" alt="Profile" />
    ) : (
      <span className="w-5 h-5 flex items-center justify-center text-xs">👤</span>
    )}
  </button>
) : (
  <Link href="/login" className="p-2 rounded-full bg-muted">
    <span className="w-5 h-5 flex items-center justify-center text-xs">👤</span>
  </Link>
)}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="shrink-0 bg-card border-t border-border px-2 py-2 safe-area-pb">
        <div className="flex justify-around items-center">
          {bottomNav.map((item) => {
            const isActive = item.href === '/' ? location === '/' : location.startsWith(item.href);
            const isMore = item.href === '/more';
            return (
              <button
                key={item.href}
                onClick={() => isMore ? setShowMore(!showMore) : null}
                className="flex flex-col items-center gap-0.5 min-w-0 flex-1"
              >
                {isMore ? (
                  <div className={`flex flex-col items-center gap-0.5 ${showMore ? 'text-primary' : 'text-muted-foreground'}`}>
                    {showMore ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
                    <span className="text-xs">More</span>
                  </div>
                ) : (
                  <Link href={item.href} className="flex flex-col items-center gap-0.5">
                    <item.icon className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}/>
                    <span className={`text-xs ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{item.label}</span>
                    {isActive && <div className="w-1 h-1 rounded-full bg-primary"/>}
                  </Link>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* More Menu Drawer */}
      {showMore && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={()=>setShowMore(false)}>
          <div className="w-full bg-card rounded-t-3xl border-t border-border p-4 max-h-[70vh] overflow-auto" onClick={e=>e.stopPropagation()}>
            <div className="w-12 h-1 bg-border rounded-full mx-auto mb-4"/>
            <h3 className="font-serif font-bold text-primary text-lg mb-3">All Features</h3>
            <div className="grid grid-cols-3 gap-3">
              {allNav.map((item) => (
                <Link key={item.href} href={item.href} onClick={()=>setShowMore(false)}>
                  <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-muted active:bg-primary/10">
                    <item.icon className="w-6 h-6 text-primary"/>
                    <span className="text-xs text-center text-foreground font-medium leading-tight">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

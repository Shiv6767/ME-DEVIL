'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookMarked, Search, Library, Compass } from 'lucide-react';
import { motion } from 'motion/react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: 'Discover', href: '/', icon: Compass },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'My Library', href: '/library', icon: Library },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#152232] px-4 sm:px-8 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-8 lg:space-x-12">
        <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <BookMarked className="h-6 w-6 text-[#3db4f2]" />
          <span>Ani<span className="text-[#3db4f2]">Nexus</span></span>
        </Link>
        <div className="hidden md:flex space-x-6 text-sm font-semibold text-[#a0b1c5]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`transition-colors py-5 ${isActive ? 'text-white' : 'hover:text-[#d3d5f3]'}`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Mobile Nav */}
        <div className="md:hidden flex space-x-4 items-center mr-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`transition-colors ${isActive ? 'text-white' : 'text-[#a0b1c5] hover:text-[#d3d5f3]'}`}
                >
                    <item.icon className="h-5 w-5" />
                </Link>
              )
            })}
        </div>
        
        <div className="relative hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <Search className="h-4 w-4 text-[#a0b1c5]" />
          </div>
          <input 
            type="text" 
            placeholder="Search anime, manga, and more..." 
            className="bg-[#0b1622] rounded py-2 pl-9 pr-4 text-xs font-semibold text-[#a0b1c5] w-64 focus:ring-1 focus:ring-[#3db4f2] transition-colors outline-none cursor-pointer placeholder:text-[#647380]"
            onClick={() => router.push('/search')}
            readOnly
          />
        </div>
        <div className="w-8 h-8 rounded bg-[#0b1622] text-[#a0b1c5] flex justify-center items-center text-xs font-bold shadow-sm">
          A
        </div>
      </div>
    </nav>
  );
}

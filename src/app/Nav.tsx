"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/scan", label: "Scanner" },
  { href: "/inventaires", label: "Historique" },
];

export default function Nav() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <nav className="bg-white border-b border-gray-200 px-4">
      <div className="max-w-2xl mx-auto flex items-center justify-between h-14">
        <Link href="/" className="font-bold text-gray-900 text-lg">
          🛒 Shelf Scanner
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

const navLinks = [
  { href: "/#katalog", label: "Katalog iPhone" },
  { href: "/#fitur", label: "Layanan & Garansi" },
  { href: "#footer", label: "About" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-black text-white backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        
        {/* Logo Kiri */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <div className="relative h-10 w-32 overflow-hidden bg-black">
              <Image
                src="/logo-purei-putih.png"
                alt="PUREI Logo"
                fill
                className="object-contain object-left filter brightness-200"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Menu Navigasi Posisi Tepat di Tengah */}
        <ul className="hidden md:flex items-center gap-8 text-xs font-mono font-medium tracking-wide text-neutral-300 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link 
                href={link.href} 
                target={link.href.startsWith("http") ? "_blank" : "_self"}
                rel={link.href.startsWith("http") ? "noopener noreferrer" : ""}
                className="transition-colors hover:text-yellow-400"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
    
        {/* Tombol Aksi Kanan (Daftar & Login) */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/daftar"
            className="inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-mono font-medium text-neutral-300 transition-colors hover:bg-neutral-900 hover:text-white"
          >
            Daftar
          </Link>
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-full bg-yellow-500 px-5 text-xs font-mono font-bold text-neutral-950 transition-all hover:bg-yellow-400 shadow-sm"
          >
            Login
          </Link>
        </div>

        {/* Tombol Mobile Menu Hamburger */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-300 hover:bg-neutral-900 hover:text-white"
            aria-expanded={open}
            aria-label="Buka menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {open ? (
        <div className="border-t border-neutral-800 bg-black px-4 py-4 md:hidden">
          <ul className="flex flex-col gap-2 text-sm font-mono text-neutral-300">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : "_self"}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : ""}
                  className="block rounded-lg px-3 py-2.5 transition hover:bg-neutral-900 hover:text-yellow-400"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <div className="mt-3 flex flex-col gap-2 pt-3 border-t border-neutral-800">
              <Link
                href="/daftar"
                className="flex h-10 w-full items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-xs font-mono font-medium text-white"
                onClick={() => setOpen(false)}
              >
                Daftar
              </Link>
              <Link
                href="/login"
                className="flex h-10 w-full items-center justify-center rounded-lg bg-yellow-500 text-xs font-mono font-bold text-neutral-950"
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
            </div>
          </ul>
        </div>
      ) : null}
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
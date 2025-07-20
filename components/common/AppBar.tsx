"use client";
import { cn } from "@/lib/utils";
import { Contact, LogOutIcon, Menu, MessageSquare, Settings2, UserIcon, X } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import UserAction from "./UserAction";

export const Appbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header id={"navbar"}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-background/80 backdrop-blur-md shadow-md"
            : "bg-transparent shadow-sm border-b-2"
        )}
      >
        <div className="container mx-auto flex justify-between items-center h-16 px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
              VaibTalk
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-foreground/70 hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              href="/contacts"
              className="text-foreground/70 hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Contact className="w-4 h-4" /> Contacts
            </Link>
            <Link
              href="/chat"
              className="text-foreground/70 hover:text-foreground transition-colors flex items-center gap-1"
            >
              <MessageSquare className="w-4 h-4" /> Chat
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <UserAction />
          </div>

          <div className="flex md:hidden items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border">
            <div className="container mx-auto py-4 px-4 flex flex-col gap-4">
              <Link
                href="/dashboard"
                className="py-2 text-foreground/70 hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/chat"
                className="py-2 text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <MessageSquare className="w-4 h-4" /> Chat
              </Link>
              <Link
                href="/contacts"
                className="py-2 text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Contact className="w-4 h-4" /> Contacts
              </Link>
              <Link
                href="/profile"
                className="py-2 text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <UserIcon className="w-4 h-4" /> Profile
              </Link>
              <Link
                href="/settings"
                className="py-2 text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Settings2 className="w-4 h-4" /> Settings
              </Link>
              <Button
                variant="ghost"
                className="py-2 text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2"
                onClick={() => {
                  signOut();
                  setIsMobileMenuOpen(false);
                }}
              >
                <LogOutIcon className="w-4 h-4" /> Logout
              </Button>
              <Link href="/chat" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 mt-2">
                  Start Talking
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

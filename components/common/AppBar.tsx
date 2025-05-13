"use client";
import { cn } from "@/lib/utils";
import { Menu, MessageSquare, Video, X } from "lucide-react";
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
              href="/chat"
              className="text-foreground/70 hover:text-foreground transition-colors flex items-center gap-1"
            >
              <MessageSquare className="w-4 h-4" /> Chat
            </Link>
            <Link
              href="/call"
              className="text-foreground/70 hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Video className="w-4 h-4" /> Video
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
                href="/"
                className="py-2 text-foreground/70 hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/chat"
                className="py-2 text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <MessageSquare className="w-4 h-4" /> Chat
              </Link>
              <Link
                href="/call"
                className="py-2 text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Video className="w-4 h-4" /> Video
              </Link>
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

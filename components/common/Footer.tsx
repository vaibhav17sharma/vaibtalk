import { Github, Instagram, MessageSquare, Twitter, Video } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black text-white">
      <div className="container mx-auto py-8 md:py-12 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                VaibTalk
              </h2>
            </Link>
            <p className="text-white/60 mb-6 text-sm md:text-base">
              The future of peer-to-peer communication with a Gen Z twist.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-white/60 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-white/60 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-white/60 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-white">Features</h3>
            <ul className="space-y-2 md:space-y-3 text-sm md:text-base">
              <li>
                <Link href="/chat" className="text-white/60 hover:text-white transition-colors flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Chat
                </Link>
              </li>
              <li>
                <Link href="/call" className="text-white/60 hover:text-white transition-colors flex items-center gap-2">
                  <Video className="w-4 h-4" /> Video Calls
                </Link>
              </li>
              <li>
                <Link href="/chat" className="text-white/60 hover:text-white transition-colors">
                  File Sharing
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-white">Learn More</h3>
            <ul className="space-y-2 md:space-y-3 text-sm md:text-base">
              <li>
                <Link href="#" className="text-white/60 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/60 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/60 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-white">Contact</h3>
            <ul className="space-y-2 md:space-y-3 text-sm md:text-base">
              <li className="text-white/60">
                support@vaibtalk.com
              </li>
              <li className="text-white/60">
                San Francisco, CA
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-8 md:mt-12 pt-8 text-center text-white/40 text-xs md:text-sm">
          <p>© {new Date().getFullYear()} VaibTalk. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
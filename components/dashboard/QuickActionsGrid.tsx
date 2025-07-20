"use client";

import { Card } from "@/components/ui/card";
import Link from "next/link";

interface QuickAction {
  title: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

interface QuickActionsGridProps {
  actions: QuickAction[];
}

export default function QuickActionsGrid({ actions }: QuickActionsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <Link key={index} href={action.href}>
          <Card className="p-6 bg-background/50 backdrop-blur-sm border-purple-500/20 hover:scale-105 transition-transform cursor-pointer group">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              {/* <h3 className="font-medium">{action.title}</h3> */}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
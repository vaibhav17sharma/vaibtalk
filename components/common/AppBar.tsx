import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { authOptions } from "@/lib/auth";
import { Menu, Package2 } from "lucide-react";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import UserAction from "./UserAction";

export const Appbar = async () => {
  const session = await getServerSession(authOptions);

  return (
    <>
      <div className="flex fixed w-full flex-col">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold md:text-base"
            >
              <Image src={"/logo.png"} alt="VaibTalk" width={100} height={100} />
              <span className="sr-only">VaibTalk</span>
            </Link>
            {session && (
              <>
                <Link
                  href="/dashboard"
                  className="text-foreground transition-colors hover:text-foreground"
                >
                  Dashboard
                </Link>
               
              </>
            )}
          </nav>
          <Sheet>
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetDescription className="sr-only">Description</SheetDescription>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <Package2 className="h-6 w-6" />
                  <span className="sr-only">VaibTalk</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="hover:text-foreground"
                >
                  Dashboard
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex flex-row-reverse w-full gap-4 items-center md:gap-2 lg:gap-4">
            <UserAction session={session} />
          </div>
        </header>
      </div>
    </>
  );
};

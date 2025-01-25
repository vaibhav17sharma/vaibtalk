"use client";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { RecoilRoot } from "recoil";

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <SessionProvider>
          <RecoilRoot>{children}</RecoilRoot>
        </SessionProvider>
      </ThemeProvider>
    </>
  );
};

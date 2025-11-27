"use client";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import { SocketProvider } from "@/components/providers/SocketProvider";
import store from "@/store/store";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { Provider } from "react-redux";

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
          <Provider store={store}>
            <SocketProvider>{children}</SocketProvider>
          </Provider>
        </SessionProvider>
      </ThemeProvider>
    </>
  );
};

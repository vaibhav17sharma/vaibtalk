import { Appbar } from "@/components/common/AppBar";
import React from "react";
import { Providers } from "../provider";

interface Props {
  children: React.ReactNode;
}

export default (props: Props) => {
  return (
    <div className="min-h-screen w-full">
      <Providers>
        <Appbar />
        <div className="wrapper w-full p-3">{props.children}</div>
      </Providers>
    </div>
  );
};

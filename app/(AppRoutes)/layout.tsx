import React from "react";
import { Providers } from "../provider";

interface Props {
  children: React.ReactNode;
}

export default (props: Props) => {
  return (
    <div className="min-h-screen w-full">
      <Providers>
        <div className="w-full">{props.children}</div>
      </Providers>
    </div>
  );
};

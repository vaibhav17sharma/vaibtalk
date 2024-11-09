import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <section className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center justify-center gap-8 text-center">
          <h1 className="text-4xl font-bold tracking-tighter text-primary md:text-6xl">
            Welcome to{" "}
            <span className="bg-gradient-to-b from-blue-400 to-blue-700 bg-clip-text pr-1 font-black tracking-tighter text-transparent">
              VaibTalk
            </span>
          </h1>
        </div>
      </section>
    </>
  );
}

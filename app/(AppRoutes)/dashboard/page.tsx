import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

const Dashboard = async () => {
  const session = await getServerSession(authOptions);

  return (
    <section className="bg-gray-900 text-white h-full">
      <div className="mx-auto max-w-screen-xl px-4 py-32 lg:flex h-full lg:items-center">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="bg-gradient-to-r from-green-300 via-blue-500 to-purple-600 bg-clip-text text-3xl font-extrabold text-transparent sm:text-5xl">
            <span className="sm:block">
              Heyyy {session?.user?.name || "There"} !
            </span>
          </h2>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;

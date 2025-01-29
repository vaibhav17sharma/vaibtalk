import FeatureCard from "@/components/common/FeatureCard";
import { authOptions } from "@/lib/auth";
import { MessageCircleMore, MonitorUp, Share, Video } from "lucide-react";
import { getServerSession } from "next-auth";

const Dashboard = async () => {
  const session = await getServerSession(authOptions);

  return (
    <section className="bg-gray-900 text-white h-full min-h-[100vh]">
      <div className="mx-auto max-w-screen-xl px-4 py-16 md:py-32 lg:flex h-full lg:items-center">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="bg-gradient-to-r from-green-300 via-blue-500 to-purple-600 bg-clip-text text-3xl font-extrabold text-transparent sm:text-5xl">
            <span className="sm:block">
              Heyy {session?.user?.name || "There"} !
            </span>
          </h2>
          <div className="mt-8 md:mt-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {features.map((feature) => (
              <FeatureCard
                key={feature.key}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                href={feature.url}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;

const features = [
  {
    key: "1",
    title: "Chat",
    url: "/chat",
    description: "Start a chat with your friends",
    icon: <MessageCircleMore className="w-8 h-8" />,
  },
  {
    key: "2",
    title: "Video Call",
    url: "/call",
    description: "Make video calls with your friends",
    icon: <Video className="w-8 h-8" />,
  },
  {
    key: "3",
    title: "File Transfer",
    url: "/transfer",
    description: "Transfer files with your friends",
    icon: <Share className="w-8 h-8" />,
  },
  {
    key: "4",
    title: "Screen Share",
    url: "/screenshare",
    description: "Share your screen with your friends",
    icon: <MonitorUp className="w-8 h-8" />,
  },
];

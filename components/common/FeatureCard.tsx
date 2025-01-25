import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function FeatureCard({
  title,
  description,
  icon,
  href,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="bg-gray-700 text-white w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center align-middle content-center">{icon}</CardContent>
      <CardFooter className="flex justify-center align-middle content-center">
        <a
          href={href}
          className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
        >
          Start Now
        </a>
      </CardFooter>
    </Card>
  );
}

import InvitePageClient from "@/components/invite/InvitePageClient";

interface InvitePageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function InvitePage(props: InvitePageProps) {
  const params = await props.params;
  
  return <InvitePageClient code={params.code} />;
}

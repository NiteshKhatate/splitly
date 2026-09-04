import { AcceptGroupInvitation } from "@/components/groups/accept-group-invitation";

type InvitationPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { groupId } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-16 lg:px-8">
      <AcceptGroupInvitation groupId={groupId} />
    </main>
  );
}

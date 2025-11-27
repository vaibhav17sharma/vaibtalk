import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: "Invalid user IDs" }, { status: 400 });
    }

    // Check if requester is admin or member (depending on policy, let's say any member can add for now, or just admin)
    // For simplicity, let's allow any member to add others for now
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
    }

    // Add members
    await prisma.groupMember.createMany({
      data: userIds.map((userId: string) => ({
        userId,
        groupId,
        role: "MEMBER",
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding members:", error);
    return NextResponse.json({ error: "Failed to add members" }, { status: 500 });
  }
}

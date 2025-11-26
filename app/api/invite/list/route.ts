import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all invites created by this user
    const invites = await prisma.inviteCode.findMany({
      where: {
        inviterId: currentUser.id,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        invitedUsername: true,
        used: true,
        usedBy: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Categorize invites
    const now = new Date();
    const activeInvites = invites.filter(
      (inv) => !inv.used && inv.expiresAt > now
    );
    const usedInvites = invites.filter((inv) => inv.used);
    const expiredInvites = invites.filter(
      (inv) => !inv.used && inv.expiresAt <= now
    );

    return NextResponse.json({
      active: activeInvites,
      used: usedInvites,
      expired: expiredInvites,
      total: invites.length,
    });
  } catch (error: any) {
    console.error("Fetch invites error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

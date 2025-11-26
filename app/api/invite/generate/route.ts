import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// Generate unique invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "VT-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate invite code
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { username } = body;

  try {
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check rate limit: max 10 invites per day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentInvites = await prisma.inviteCode.count({
      where: {
        inviterId: currentUser.id,
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    if (recentInvites >= 10) {
      return NextResponse.json(
        { error: "You have reached the daily invite limit (10 per day)" },
        { status: 429 }
      );
    }

    // Check if there's already an active invite for this username
    if (username) {
      const existingInvite = await prisma.inviteCode.findFirst({
        where: {
          inviterId: currentUser.id,
          invitedUsername: username,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (existingInvite) {
        // Return the existing invite instead of creating a new one
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const inviteLink = `${baseUrl}/invite/${existingInvite.code}`;
        
        return NextResponse.json({
          success: true,
          code: existingInvite.code,
          inviteLink,
          expiresAt: existingInvite.expiresAt,
          message: "Using existing invite for this username",
        });
      }
    }

    // Generate unique code
    let code = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.inviteCode.findUnique({
        where: { code },
      });
      if (!existing) break;
      code = generateInviteCode();
      attempts++;
    }

    // Create invite
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const invite = await prisma.inviteCode.create({
      data: {
        code,
        inviterId: currentUser.id,
        invitedUsername: username || null,
        expiresAt,
      },
    });

    // Generate invite link
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/invite/${code}`;

    return NextResponse.json({
      success: true,
      code: invite.code,
      inviteLink,
      expiresAt: invite.expiresAt,
    });
  } catch (error: any) {
    console.error("Generate invite error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

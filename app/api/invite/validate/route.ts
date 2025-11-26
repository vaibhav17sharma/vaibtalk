import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Invite code is required" },
      { status: 400 }
    );
  }

  try {
    const invite = await prisma.inviteCode.findUnique({
      where: { code },
      include: {
        inviter: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { valid: false, error: "Invalid invite code" },
        { status: 404 }
      );
    }

    // Check if expired
    const isExpired = new Date() > invite.expiresAt;
    if (isExpired) {
      return NextResponse.json({
        valid: false,
        expired: true,
        error: "This invite code has expired",
      });
    }

    // Check if already used
    if (invite.used) {
      return NextResponse.json({
        valid: false,
        used: true,
        error: "This invite code has already been used",
      });
    }

    return NextResponse.json({
      valid: true,
      inviter: invite.inviter,
      invitedUsername: invite.invitedUsername,
      expiresAt: invite.expiresAt,
    });
  } catch (error: any) {
    console.error("Validate invite error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

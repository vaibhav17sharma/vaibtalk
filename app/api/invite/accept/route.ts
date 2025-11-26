import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { code } = body;

  if (!code) {
    return NextResponse.json(
      { error: "Invite code is required" },
      { status: 400 }
    );
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, username: true, name: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: "This invite code has expired" },
        { status: 400 }
      );
    }

    // Check if already used
    if (invite.used) {
      return NextResponse.json(
        { error: "This invite code has already been used" },
        { status: 400 }
      );
    }

    // Check if trying to use own invite
    if (invite.inviterId === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot use your own invite code" },
        { status: 400 }
      );
    }

    // Check if already contacts
    const existingContact = await prisma.contact.findUnique({
      where: {
        userId_contactId: {
          userId: currentUser.id,
          contactId: invite.inviterId,
        },
      },
    });

    if (existingContact) {
      return NextResponse.json(
        { error: "You are already connected with this user" },
        { status: 409 }
      );
    }

    // Create mutual contact relationship and mark invite as used
    const [updatedInvite, contact1, contact2] = await prisma.$transaction([
      // Mark invite as used
      prisma.inviteCode.update({
        where: { id: invite.id },
        data: {
          used: true,
          usedBy: currentUser.id,
        },
      }),
      // Create contact for current user
      prisma.contact.create({
        data: {
          userId: currentUser.id,
          contactId: invite.inviterId,
          contactName: invite.inviter.name,
        },
      }),
      // Create contact for inviter
      prisma.contact.create({
        data: {
          userId: invite.inviterId,
          contactId: currentUser.id,
          contactName: currentUser.name,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `You are now connected with ${invite.inviter.name}`,
      inviter: invite.inviter,
    });
  } catch (error: any) {
    console.error("Accept invite error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

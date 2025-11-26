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
  const { username } = body;

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
      },
    });

    if (!user) {
      return NextResponse.json({ exists: false });
    }

    // Check if it's the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (currentUser?.id === user.id) {
      return NextResponse.json(
        { error: "You cannot add yourself as a contact" },
        { status: 400 }
      );
    }

    // Check if already in contacts
    const existingContact = await prisma.contact.findUnique({
      where: {
        userId_contactId: {
          userId: currentUser!.id,
          contactId: user.id,
        },
      },
    });

    if (existingContact) {
      return NextResponse.json(
        { error: "Already in your contacts" },
        { status: 409 }
      );
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.contactRequest.findFirst({
      where: {
        OR: [
          { senderId: currentUser!.id, receiverId: user.id, status: "pending" },
          { senderId: user.id, receiverId: currentUser!.id, status: "pending" },
        ],
      },
    });

    return NextResponse.json({
      exists: true,
      user,
      hasPendingRequest: !!existingRequest,
      requestDirection: existingRequest
        ? existingRequest.senderId === currentUser!.id
          ? "sent"
          : "received"
        : null,
    });
  } catch (error: any) {
    console.error("Check user error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

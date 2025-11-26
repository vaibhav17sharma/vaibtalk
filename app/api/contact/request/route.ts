import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// Send a contact request
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { receiverUsername } = body;

  if (!receiverUsername) {
    return NextResponse.json(
      { error: "Receiver username is required" },
      { status: 400 }
    );
  }

  try {
    // Get both users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: session.user.email },
          { username: receiverUsername },
        ],
      },
      select: { id: true, email: true, username: true, name: true },
    });

    const currentUser = users.find((u) => u.email === session.user.email);
    const receiverUser = users.find((u) => u.username === receiverUsername);

    if (!currentUser || !receiverUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (currentUser.id === receiverUser.id) {
      return NextResponse.json(
        { error: "You cannot send a request to yourself" },
        { status: 400 }
      );
    }

    // Check if already contacts
    const existingContact = await prisma.contact.findUnique({
      where: {
        userId_contactId: {
          userId: currentUser.id,
          contactId: receiverUser.id,
        },
      },
    });

    if (existingContact) {
      return NextResponse.json(
        { error: "Already in your contacts" },
        { status: 409 }
      );
    }

    // Check for existing request
    const existingRequest = await prisma.contactRequest.findFirst({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: receiverUser.id },
          { senderId: receiverUser.id, receiverId: currentUser.id },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return NextResponse.json(
          { error: "A contact request already exists" },
          { status: 409 }
        );
      }
      // If rejected, allow sending a new request
      if (existingRequest.status === "rejected") {
        const updatedRequest = await prisma.contactRequest.update({
          where: { id: existingRequest.id },
          data: {
            status: "pending",
            senderId: currentUser.id,
            receiverId: receiverUser.id,
            updatedAt: new Date(),
          },
        });
        return NextResponse.json({ success: true, request: updatedRequest });
      }
    }

    // Create new request
    const newRequest = await prisma.contactRequest.create({
      data: {
        senderId: currentUser.id,
        receiverId: receiverUser.id,
        status: "pending",
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error: any) {
    console.error("Send contact request error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// Get all contact requests (sent and received)
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

    const [sentRequests, receivedRequests] = await Promise.all([
      prisma.contactRequest.findMany({
        where: {
          senderId: currentUser.id,
          status: "pending",
        },
        include: {
          receiver: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.contactRequest.findMany({
        where: {
          receiverId: currentUser.id,
          status: "pending",
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      sent: sentRequests,
      received: receivedRequests,
    });
  } catch (error: any) {
    console.error("Fetch contact requests error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

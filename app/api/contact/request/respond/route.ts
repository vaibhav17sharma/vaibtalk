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
  const { requestId, action } = body;

  if (!requestId || !action) {
    return NextResponse.json(
      { error: "Request ID and action are required" },
      { status: 400 }
    );
  }

  if (!["accept", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the request
    const request = await prisma.contactRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
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

    if (!request) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // Verify the current user is the receiver
    if (request.receiverId !== currentUser.id) {
      return NextResponse.json(
        { error: "You are not authorized to respond to this request" },
        { status: 403 }
      );
    }

    if (request.status !== "pending") {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    if (action === "reject") {
      // Update request status to rejected
      await prisma.contactRequest.update({
        where: { id: requestId },
        data: { status: "rejected" },
      });

      return NextResponse.json({
        success: true,
        message: "Contact request rejected",
      });
    }

    // Accept: Create mutual contact relationship
    const [updatedRequest, contact1, contact2] = await prisma.$transaction([
      // Update request status
      prisma.contactRequest.update({
        where: { id: requestId },
        data: { status: "accepted" },
      }),
      // Create contact for receiver (current user)
      prisma.contact.create({
        data: {
          userId: request.receiverId,
          contactId: request.senderId,
          contactName: request.sender.name,
        },
      }),
      // Create contact for sender
      prisma.contact.create({
        data: {
          userId: request.senderId,
          contactId: request.receiverId,
          contactName: request.receiver.name,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Contact request accepted",
      contacts: [contact1, contact2],
    });
  } catch (error: any) {
    console.error("Respond to contact request error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

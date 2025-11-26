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
  const { contactId, contactName, nickname, action } = body;

  if (!contactId || !action) {
    return NextResponse.json(
      { error: "Missing required fields or invalid action" },
      { status: 400 }
    );
  }

  try {
    // Fetch both users in one call using OR
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: session.user.email },
          { username: contactId },
        ],
      },
      select: { id: true, email: true , username: true },
    });

    const currentUser = users.find(u => u.email === session.user.email);
    const contactUser = users.find(u => u.username === contactId);

    if (!currentUser || !contactUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (currentUser.id === contactUser.id) {
      return NextResponse.json(
        { error: "You cannot target yourself" },
        { status: 400 }
      );
    }

    const contactKey = {
      userId: currentUser.id,
      contactId: contactUser.id,
    };

    // Use only when needed
    const needsExistingCheck = ["BLOCK_CONTACT", "UNBLOCK_CONTACT", "DELETE_CONTACT"];
    let existingContact = null;

    if (needsExistingCheck.includes(action) || action === "ADD_CONTACT") {
      existingContact = await prisma.contact.findUnique({
        where: { userId_contactId: contactKey },
        select: { id: true, blocked: true },
      });
    }

    switch (action) {
      case "ADD_CONTACT": {
        if (existingContact) {
          return NextResponse.json(
            { error: "Contact already exists" },
            { status: 409 }
          );
        }

        const newContact = await prisma.contact.create({
          data: {
            ...contactKey,
            contactName,
            nickname,
          },
        });

        return NextResponse.json({ success: true, contact: newContact });
      }

      case "BLOCK_CONTACT": {
        if (!existingContact) {
          return NextResponse.json(
            { error: "Contact not found" },
            { status: 404 }
          );
        }

        if (existingContact.blocked) {
          return NextResponse.json({ success: true, contact: existingContact });
        }

        const updated = await prisma.contact.update({
          where: { userId_contactId: contactKey },
          data: { blocked: true },
        });

        return NextResponse.json({ success: true, contact: updated });
      }

      case "UNBLOCK_CONTACT": {
        if (!existingContact) {
          return NextResponse.json(
            { error: "Contact not found" },
            { status: 404 }
          );
        }

        if (!existingContact.blocked) {
          return NextResponse.json({ success: true, contact: existingContact });
        }

        const updated = await prisma.contact.update({
          where: { userId_contactId: contactKey },
          data: { blocked: false },
        });

        return NextResponse.json({ success: true, contact: updated });
      }

      case "DELETE_CONTACT": {
        if (!existingContact) {
          return NextResponse.json(
            { error: "Contact not found" },
            { status: 404 }
          );
        }

        await prisma.contact.delete({
          where: { userId_contactId: contactKey },
        });

        return NextResponse.json({ success: true, message: "Contact deleted" });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Contact action error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let contacts = await prisma.contact.findMany({
      where: { userId: session.user.id},
      include: {
        contact: {
          select: {
            username: true,
            avatar: true,
            name: true,
          },
        },
      },
    });
    return NextResponse.json({ contacts });
  } catch (error: any) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
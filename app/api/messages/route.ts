import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import "socket.io"; // Force include in standalone build

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const peerId = searchParams.get("peerId");
    const groupId = searchParams.get("groupId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const cursor = searchParams.get("cursor");

    if (!peerId && !groupId) {
      return NextResponse.json({ error: "peerId or groupId required" }, { status: 400 });
    }

    let whereClause: any = {};

    if (groupId) {
      // Check membership
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

      whereClause = { groupId };
    } else if (peerId) {
      // 1:1 chat
      const peer = await prisma.user.findUnique({
        where: { username: peerId },
        select: { id: true },
      });

      if (!peer) {
        return NextResponse.json({ error: "Peer not found" }, { status: 404 });
      }

      whereClause = {
        OR: [
          { senderId: session.user.id, receiverId: peer.id },
          { senderId: peer.id, receiverId: session.user.id },
        ],
      };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: "asc", // Fetch oldest to newest for chat
      },
      include: {
        sender: {
          select: {
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

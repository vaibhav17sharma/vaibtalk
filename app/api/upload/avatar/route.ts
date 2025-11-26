import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma";
import { existsSync } from "fs";
import { unlink } from "fs/promises";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import sharp from "sharp";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // 1. Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get file from form data
    const formData = await req.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3. Validate file
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed" },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // 4. Get current user to check for existing avatar
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true },
    });

    // 5. Delete old avatar if exists (and it's a local file)
    if (user?.avatar && user.avatar.startsWith("/uploads/avatars/")) {
      const oldFilePath = path.join(process.cwd(), "public", user.avatar);
      if (existsSync(oldFilePath)) {
        try {
          await unlink(oldFilePath);
        } catch (error) {
          console.error("Failed to delete old avatar:", error);
        }
      }
    }

    // 6. Process and save new image
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const filename = `${session.user.id}-${Date.now()}.jpg`;
    const filepath = path.join(
      process.cwd(),
      "public/uploads/avatars",
      filename
    );

    // Optimize image with Sharp
    await sharp(buffer)
      .resize(400, 400, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 85 })
      .toFile(filepath);

    // 7. Update user avatar in database
    const avatarUrl = `/uploads/avatars/${filename}`;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: avatarUrl },
    });

    return NextResponse.json({
      success: true,
      url: avatarUrl,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

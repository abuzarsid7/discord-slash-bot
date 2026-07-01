"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateConfig(formData: FormData) {
  const keywords = formData.get("keywords") as string;
  const mirrorUrl = formData.get("mirrorUrl") as string;

  if (keywords !== null && keywords !== undefined) {
    await prisma.config.upsert({
      where: { key: "flagged_keywords" },
      update: { value: keywords },
      create: { key: "flagged_keywords", value: keywords },
    });
  }

  if (mirrorUrl !== null && mirrorUrl !== undefined) {
    await prisma.config.upsert({
      where: { key: "mirror_webhook_url" },
      update: { value: mirrorUrl },
      create: { key: "mirror_webhook_url", value: mirrorUrl },
    });
  }

  revalidatePath("/dashboard");
}

export async function updateFlaggedKeywords(formData: FormData) {
  return updateConfig(formData);
}

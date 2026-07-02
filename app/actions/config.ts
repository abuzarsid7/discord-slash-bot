"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateConfig(formData: FormData) {
  const keywords = formData.get("keywords") as string;
  const mirrorUrl = formData.get("mirrorUrl") as string;
  const guildId = (formData.get("guildId") as string) || "default";

  if (keywords !== null && keywords !== undefined) {
    await prisma.config.upsert({
      where: { guildId_key: { guildId, key: "flagged_keywords" } },
      update: { value: keywords },
      create: { guildId, key: "flagged_keywords", value: keywords },
    });
  }

  if (mirrorUrl !== null && mirrorUrl !== undefined) {
    await prisma.config.upsert({
      where: { guildId_key: { guildId, key: "mirror_webhook_url" } },
      update: { value: mirrorUrl },
      create: { guildId, key: "mirror_webhook_url", value: mirrorUrl },
    });
  }

  revalidatePath("/dashboard");
}

export async function updateFlaggedKeywords(formData: FormData) {
  return updateConfig(formData);
}

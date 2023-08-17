import type { NextApiResponse } from "next";
import type { NextApiRequestQuery } from "next/dist/server/api-utils";
import { PrismaClient } from "@prisma/client";

export default async function keepalive(
  req: NextApiRequestQuery,
  res: NextApiResponse
) {
  const prisma = new PrismaClient();
  const firstDog = await prisma.breed.findFirst();
  if (firstDog === null) {
    res.status(500).json({ success: false });
    return;
  }
  await prisma.breed.update({
    where: {
      id: firstDog.id,
    },
    data: {
      forVotes: firstDog.forVotes,
    },
  });

  res.status(200).json({ success: true });
}

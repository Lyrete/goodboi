import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";

const apiUrl = "https://dog.ceo/api";

type DogBreedsApiResponse = {
  message: {
    [breed: string]: string[];
  };
  status: string;
};

type PictureApiResponse = {
  message: string;
  status: string;
};

type Breed = {
  breed: string;
  votes: number;
  displayName: string;
};

const capitalize = (s: string) => s.slice(0, 1).toUpperCase() + s.slice(1);

export const dogsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    const response = await fetch(`${apiUrl}/breeds/list/all`);

    if (!response.ok) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch dogs",
      });
    }

    const apiResponse = (await response.json()) as DogBreedsApiResponse;

    const breedList: Breed[] = [];

    for (const [breed, subBreeds] of Object.entries(apiResponse.message)) {
      if (subBreeds.length > 0) {
        breedList.push(
          ...subBreeds.map((subBreed) => ({
            breed: `${breed}_${subBreed}`,
            votes: 0,
            displayName: `${capitalize(breed)} (${capitalize(subBreed)})`,
          }))
        );
      } else {
        breedList.push({ breed, votes: 0, displayName: capitalize(breed) });
      }
    }

    return { breeds: breedList };
  }),
  getPictureForBreed: publicProcedure
    .input(z.object({ breed: z.string() }))
    .query(async ({ input }) => {
      const breedAsUrl = input.breed.replace("_", "/");

      const response = await fetch(
        `${apiUrl}/breed/${breedAsUrl}/images/random`
      );

      if (!response.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch dogs",
        });
      }

      const apiResponse = (await response.json()) as PictureApiResponse;

      return { picture: apiResponse.message };
    }),
  voteFor: publicProcedure
    .input(z.object({ breed: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.breed.upsert({
        where: { name: input.breed },
        create: { name: input.breed, forVotes: 1 },
        update: { forVotes: { increment: 1 } },
      });

      return "OK";
    }),
  voteAgainst: publicProcedure
    .input(z.object({ breed: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.breed.upsert({
        where: { name: input.breed },
        create: { name: input.breed, againstVotes: 1 },
        update: { againstVotes: { increment: 1 } },
      });

      return "OK";
    }),
  getBreedVotes: publicProcedure
    .input(z.object({ breed: z.string() }))
    .query(async ({ input, ctx }) => {
      const result = await ctx.prisma.breed.findUnique({
        where: { name: input.breed },
      });

      if (!result) return { total: 0, amount: 0 };

      return {
        total: result.forVotes - result.againstVotes,
        amount: result.forVotes + result.againstVotes,
      };
    }),
});

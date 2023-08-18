import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

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
  getStored: publicProcedure.query(async ({ ctx }) => {
    const storedBreeds = await ctx.prisma.breed.findMany();

    const breeds = storedBreeds.map((breed) => ({
      breed: breed.name,
      votes: breed.forVotes - breed.againstVotes,
      displayName: breed.prettyName,
    }));

    return { breeds };
  }),
  refreshBreeds: publicProcedure.query(async ({ ctx }) => {
    const response = await fetch(`${apiUrl}/breeds/list/all`);

    if (!response.ok) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch dogs",
      });
    }

    const savedBreeds = await ctx.prisma.breed.findMany();

    const apiResponse = (await response.json()) as DogBreedsApiResponse;

    const breedList: Breed[] = [];

    for (const [breed, subBreeds] of Object.entries(apiResponse.message)) {
      if (subBreeds.length > 0) {
        subBreeds.forEach((subBreed) => {
          const breedName = `${breed}_${subBreed}`;

          breedList.push({
            breed: breedName,
            votes: 0,
            displayName: `${capitalize(breed)} (${capitalize(subBreed)})`,
          });
        });
      } else {
        breedList.push({ breed, votes: 0, displayName: capitalize(breed) });
      }
    }

    if (savedBreeds.length === breedList.length) {
      return { breeds: breedList };
    }

    const savedBreedNames = savedBreeds.map((breed) => breed.name);

    const newBreeds = breedList.filter(
      (elem) => savedBreedNames.indexOf(elem.breed) < 0
    );

    await ctx.prisma.breed.createMany({
      data: newBreeds.map((breed) => ({
        name: breed.breed,
        prettyName: breed.displayName,
      })),
      skipDuplicates: true,
    });

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
          message: "Failed to fetch a picture for the breed",
        });
      }

      const apiResponse = (await response.json()) as PictureApiResponse;

      return { picture: apiResponse.message };
    }),
  vote: publicProcedure
    .input(
      z.object({
        breed: z.string(),
        vote: z.enum(["for", "against"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [forVotes, againstVotes] = input.vote === "for" ? [1, 0] : [0, 1];
      const breed = await ctx.prisma.breed.upsert({
        where: { name: input.breed },
        create: { name: input.breed, forVotes, againstVotes },
        update: {
          forVotes: { increment: forVotes },
          againstVotes: { increment: againstVotes },
        },
      });

      return {
        total: breed.forVotes - breed.againstVotes,
        amount: breed.forVotes + breed.againstVotes,
      };
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

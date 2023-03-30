import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";

import { api } from "~/utils/api";
import { useState, type Dispatch } from "react";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";

import HashLoader from "react-spinners/HashLoader";

const DogList = (props: { setBreed: Dispatch<string>; breed: string }) => {
  const dogs = api.dogs.getAll.useQuery(void {}, {
    refetchOnWindowFocus: false,
  });

  if (dogs.status === "loading") return <p>Loading...</p>;
  if (dogs.status === "error") return <p>Error: {dogs.error.message}</p>;

  if (!dogs.data) return <p>No data</p>;

  const breedList = dogs.data.breeds.map((breed) => {
    return (
      <li
        className={
          (props.breed === breed.breed ? "bg-blue-600" : "hover:bg-slate-600") +
          " p-2"
        }
        key={breed.breed}
        onClick={() => {
          props.setBreed(breed.breed);
        }}
      >
        {breed.displayName}
      </li>
    );
  });

  return (
    <ul className="text-m h-96 overflow-auto text-xl text-white">
      {breedList}
    </ul>
  );
};

const VoteDialog = (props: {
  breed: string;
  votes: Map<string, "for" | "against">;
  setVote: Dispatch<Map<string, "for" | "against">>;
}) => {
  const voteFor = api.dogs.voteFor.useMutation();
  const voteAgainst = api.dogs.voteAgainst.useMutation();
  const breedImages = api.dogs.getPictureForBreed.useQuery(
    { breed: props.breed },
    { refetchOnWindowFocus: false }
  );
  const breedVotes = api.dogs.getBreedVotes.useQuery(
    { breed: props.breed },
    { refetchInterval: 1000 }
  );

  const [forState, setForState] = useState(
    props.votes.get(props.breed) === "for"
  );
  const [againstState, setAgainstState] = useState(
    props.votes.get(props.breed) === "against"
  );

  const altText = `Picture of a ${props.breed}`;

  const Picture = () => {
    //Show spinner if fetching a random picture still
    if (
      breedImages.status === "loading" ||
      breedImages.status === "error" ||
      !breedImages.data
    )
      return (
        <HashLoader
          size={100}
          color="#ffffff"
          cssOverride={{ height: 500, width: 500 }}
        />
      );

    return (
      <Image
        src={breedImages.data.picture}
        alt={altText}
        width={500}
        height={500}
        style={{
          objectFit: "contain",
          maxHeight: "500px",
          maxWidth: "500px",
          minWidth: "500px",
          minHeight: "500px",
          textAlign: "center",
          lineHeight: "4em",
        }}
      />
    );
  };

  const votes = new Map(props.votes);

  return (
    <div className="flex flex-col text-xl text-white">
      <Picture />
      <div className="flex flex-row justify-center gap-8 pt-4">
        <button
          onClick={() => {
            //Stop double votes
            if (forState || againstState) return;
            voteFor.mutate({ breed: props.breed });
            setForState(true);
            votes.set(props.breed, "for");
            props.setVote(votes);
          }}
        >
          <FaThumbsUp
            className={
              "h-8 w-8 " +
              (forState ? "text-green-600" : "hover:text-green-600")
            }
          />
        </button>
        <div>
          {breedVotes.data &&
            `${breedVotes.data.total} (${breedVotes.data.amount} votes)`}
        </div>
        <button
          onClick={() => {
            if (againstState || forState) return;
            voteAgainst.mutate({ breed: props.breed });
            setAgainstState(true);
            votes.set(props.breed, "against");
            props.setVote(votes);
          }}
        >
          <FaThumbsDown
            className={
              "h-8 w-8 " +
              (againstState ? "text-red-600" : "hover:text-red-600")
            }
          />
        </button>
      </div>
    </div>
  );
};

const Home: NextPage = () => {
  const [breed, setBreed] = useState("sheepdog_shetland");
  const [votes, setVote] = useState<Map<string, "for" | "against">>(new Map());

  return (
    <>
      <Head>
        <title>Goodboi</title>
        <meta name="description" content="Who's the goodest boi" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Good Boy and Girl Rater
          </h1>

          <div className="flex flex-row gap-5">
            <DogList setBreed={setBreed} breed={breed} />

            <VoteDialog
              breed={breed}
              votes={votes}
              setVote={setVote}
              key={breed}
            />
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;

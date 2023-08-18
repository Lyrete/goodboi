import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";

import { api } from "~/utils/api";
import { useState, type Dispatch, useRef, MutableRefObject } from "react";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";

import { Circles } from "react-loader-spinner";

const DogList = (props: {
  setBreed: Dispatch<string>;
  breed: string;
  breedRefs: MutableRefObject<Map<string, HTMLLIElement>>;
}) => {
  const dogs = api.dogs.getAll.useQuery(void {}, {
    refetchOnWindowFocus: false,
  });

  if (dogs.status === "loading" || dogs.status === "error")
    <Circles
      height={100}
      width={100}
      color="#ffffff"
      wrapperStyle={{}}
      wrapperClass="h-full items-center"
      visible={true}
      ariaLabel="circles-loading"
    />;

  if (!dogs.data)
    return (
      <Circles
        height={100}
        width={100}
        color="#ffffff"
        wrapperStyle={{}}
        wrapperClass="h-full w-1/3 items-center"
        visible={true}
        ariaLabel="circles-loading"
      />
    );

  const breedList = dogs.data.breeds.map((breed) => {
    return (
      <li
        ref={(el) =>
          el === null
            ? props.breedRefs.current.delete(breed.breed)
            : props.breedRefs.current.set(breed.breed, el)
        }
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

  props.breedRefs.current
    .get(props.breed)
    ?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <ul className="text-m h-full w-1/3 overflow-auto text-xl text-white">
      {breedList}
    </ul>
  );
};

const VoteDialog = (props: {
  breed: string;
  votes: Map<string, "for" | "against">;
  setVote: Dispatch<Map<string, "for" | "against">>;
  setBreed: Dispatch<string>;
  breedRefs: MutableRefObject<Map<string, HTMLLIElement>>;
}) => {
  const voteMutation = api.dogs.vote.useMutation();
  const breedImages = api.dogs.getPictureForBreed.useQuery(
    { breed: props.breed },
    { refetchOnWindowFocus: false, cacheTime: 0 }
  );
  const breedVotes = api.dogs.getBreedVotes.useQuery({ breed: props.breed });
  const utils = api.useContext();

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
        <Circles
          height={100}
          width={100}
          color="#ffffff"
          wrapperStyle={{}}
          wrapperClass="h-full items-center"
          visible={true}
          ariaLabel="circles-loading"
        />
      );

    return (
      <Image
        className="h-full w-auto"
        src={breedImages.data.picture}
        alt={altText}
        width={500}
        height={500}
        style={{
          objectFit: "contain",
          textAlign: "center",
          lineHeight: "4em",
        }}
      />
    );
  };

  const handleVote = async (vote: "for" | "against") => {
    if (forState || againstState) return;
    if (vote === "for") {
      setForState(true);
    } else {
      setAgainstState(true);
    }

    votes.set(props.breed, vote);
    props.setVote(votes);
    const newVotes = await voteMutation.mutateAsync({
      breed: props.breed,
      vote,
    });
    utils.dogs.getBreedVotes.setData({ breed: props.breed }, newVotes);

    //Super janky way to get a new breed to vote for
    const eligibleBreeds = Array.from(props.breedRefs.current.keys()).filter(
      (breed) => !votes.has(breed)
    );

    const newBreed =
      eligibleBreeds[Math.floor(Math.random() * eligibleBreeds.length)];

    if (!newBreed) return;

    setTimeout(() => props.setBreed(newBreed), 1500);
  };

  const votes = new Map(props.votes);

  return (
    <div className="flex w-2/3 flex-col items-center gap-4 align-top text-xl text-white">
      <Picture />
      <div className="float-left flex flex-row gap-4">
        <button
          onClick={() => {
            handleVote("for").catch(() => console.log("Vote failed"));
          }}
        >
          <FaThumbsUp
            className={
              "h-8 w-8 " +
              (forState ? "text-green-600" : "hover:text-green-600")
            }
          />
        </button>
        <span>
          {breedVotes.data
            ? `${breedVotes.data.total} (${breedVotes.data.amount} votes)`
            : "0 (0 votes)"}
        </span>
        <button
          onClick={() => {
            handleVote("against").catch(() => console.log("Vote failed"));
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
  const breedRefs = useRef(new Map<string, HTMLLIElement>());

  return (
    <>
      <Head>
        <title>Goodboi</title>
        <meta name="description" content="Who's the goodest boi" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex h-screen w-full flex-col items-center justify-center gap-12 px-4 py-16 md:w-1/2 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Good Boy and Girl Rater
          </h1>

          <div className="flex h-2/3 w-full flex-row gap-5 ">
            <DogList setBreed={setBreed} breed={breed} breedRefs={breedRefs} />

            <VoteDialog
              breed={breed}
              votes={votes}
              setVote={setVote}
              setBreed={setBreed}
              key={breed}
              breedRefs={breedRefs}
            />
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;

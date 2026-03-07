import NavBar from "./components/NavBar";
import PairGroupList from "./components/PairGroupList";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100wh-48px)]">
      <NavBar />
      <main className="flex items-center justify-center w-full">
        <PairGroupList />
      </main>
    </div>
  );
}

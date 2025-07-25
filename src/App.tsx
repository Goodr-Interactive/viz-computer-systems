import type { JSX } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home, CSC369 } from "./pages";
import { Scheduler } from "./pages/csc369/components";

// operating system pages
import { SimplePaging } from "./pages/csc369/SimplePaging";
import { TranslationExampleNew } from "./pages/csc369/TranslationExampleNew";
import { FileSystemExample } from "./pages/csc369/FileSystemExample";
import { LinkComparison } from "./pages/csc369/LinkComparison";

// computer architecture pages
import { CSC368 } from "./pages/csc368/CSC368";
import { Pipelining } from "./pages/csc368/pipelining";
import {
  CV_PRODUCER_CONSUMER,
  DEADLOCK,
  // MULTI_READER_WRITER,
  PRODUCER_CONSUMER,
  SIMPLE_MUTEX,
  Threads,
  ZEMAPHORES,
} from "./pages/csc369/components/threads";
import { Caches } from "./pages/csc368/cache";
import { Coherence } from "./pages/csc368/coherence";
import { AssociativityPage as Associativity } from "./pages/csc368/cache/associativity";
import { PipeliningThroughputPage } from "./pages/csc368/pipelining/pipelining-throughput";
import { PipeliningComparisonPage } from "./pages/csc368/pipelining/pipelining-comparison";

export interface AppRoute {
  path: string;
  title: string;
  description: string;
  element: JSX.Element;
}

export const ROUTES: AppRoute[] = [
  {
    path: "/csc369",
    title: "CSC369",
    description: "",
    element: <CSC369 />,
  },
  {
    path: "/csc369/the-scheduler",
    title: "The Scheduler",
    description: "",
    element: <Scheduler />,
  },
  {
    path: "/csc369/threads-mutex",
    title: "Threads – Mutual Exclusion",
    description: "",
    element: <Threads {...SIMPLE_MUTEX} />,
  },
  {
    path: "/csc369/threads-deadlock",
    title: "Threads – Deadlock",
    description: "",
    element: <Threads {...DEADLOCK} />,
  },
  {
    path: "/csc369/threads-producer-consumer",
    title: "Threads – Producer & Consumer with Semaphores",
    description: "",
    element: <Threads {...PRODUCER_CONSUMER} />,
  },
  {
    path: "/csc369/threads-zemaphores",
    title: "Threads – Zemaphores",
    description: "",
    element: <Threads {...ZEMAPHORES} />,
  },
  // {
  //   path: "/csc369/threads-multi-reader-writer",
  //   title: "Threads – Multiple Reader & Single Writer",
  //   description: "",
  //   element: <Threads {...MULTI_READER_WRITER} />,
  // },
  {
    path: "/csc369/threads-cv-producer-consumer",
    title: "Threads – Producer & Consumer with Condition Variables",
    description: "",
    element: <Threads {...CV_PRODUCER_CONSUMER} />,
  },
  {
    path: "/csc369/paging",
    title: "Paging",
    description: "",
    element: <SimplePaging />,
  },
  {
    path: "/csc368",
    title: "CSC368",
    description: "",
    element: <CSC368 />,
  },
  {
    path: "/csc368/coherence",
    title: "Coherence",
    description: "",
    element: <Coherence />,
  },
  {
    path: "/csc368/pipelining",
    title: "Instruction Pipelining",
    description: "",
    element: <Pipelining />,
  },
  {
    path: "/csc368/pipelining-comparison",
    title: "Pipelining Comparison",
    description: "",
    element: <PipeliningComparisonPage />,
  },
  {
    path: "/csc368/pipelining-throughput",
    title: "Pipelining Throughput",
    description: "",
    element: <PipeliningThroughputPage />,
  },
  {
    path: "/csc368/associativity",
    title: "Associativity",
    description: "",
    element: <Associativity />,
  },
  {
    path: "/csc368/caches",
    title: "Caches",
    description: "",
    element: <Caches />,
  },
  {
    path: "/csc369/paging/translation",
    title: "Address Translation",
    description: "",
    element: <TranslationExampleNew />,
  },
  {
    path: "/csc369/filesystem/lookup",
    title: "File System Lookup",
    description: "",
    element: <FileSystemExample />,
  },
  {
    path: "/csc369/filesystem/links",
    title: "File System Links",
    description: "",
    element: <LinkComparison />,
  },
];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route key={"/"} element={<Home routes={ROUTES} />} path="/" />
        {ROUTES.map(({ element, path }) => (
          <Route key={path} element={element} path={path} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

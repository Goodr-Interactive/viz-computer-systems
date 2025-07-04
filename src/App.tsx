import type { JSX } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home, CSC369 } from "./pages";
import { Scheduler } from "./pages/csc369/components";

// operating system pages
import { SimplePaging } from "./pages/csc369/SimplePaging";
import { TranslationExampleNew } from "./pages/csc369/TranslationExampleNew";
import { FileSystemExample } from "./pages/csc369/components/fileSystem/FileSystemExample";

// computer architecture pages
import { CSC368 } from "./pages/csc368/CSC368";
import { Pipelining } from "./pages/csc368/pipelining";
import { Caches } from "./pages/csc368/cache";
import { AssociativityPage as Associativity } from "./pages/csc368/cache/associativity";

interface AppRoute {
  path: string;
  element: JSX.Element;
}

const ROUTES: AppRoute[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/csc369",
    element: <CSC369 />,
  },
  {
    path: "/csc369/the-scheduler",
    element: <Scheduler />,
  },
  {
    path: "/csc368",
    element: <CSC368 />,
  },
  {
    path: "/csc368/pipelining",
    element: <Pipelining />,
  },
  {
    path: "/csc368/associativity",
    element: <Associativity />,
  },
  {
    path: "/csc368/caches",
    element: <Caches />,
  },
  {
    path: "/csc369/paging",
    element: <SimplePaging />,
  },
  {
    path: "/csc369/paging/translation",
    element: <TranslationExampleNew />,
  },
  {
    path: "/csc369/filesystem/lookup",
    element: <FileSystemExample />,
  },
];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {ROUTES.map(({ element, path }) => (
          <Route key={path} element={element} path={path} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

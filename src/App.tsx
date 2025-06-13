import type { JSX } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home, CSC369 } from "./pages";
import { Scheduler } from "./pages/csc369/components";

// operating system pages
import { SimplePaging } from "./pages/csc369/SimplePaging";

// computer architecture pages
import { CSC368 } from "./pages/csc368/CSC368";
import { Pipelining } from "./pages/csc368/pipelining";
import { DEADLOCK, SIMPLE_MUTEX, Threads } from "./pages/csc369/components/threads";

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
    path: "/csc369/threads-mutex",
    element: <Threads {...SIMPLE_MUTEX} />,
  },
  {
    path: "/csc369/threads-deadlock",
    element: <Threads {...DEADLOCK} />,
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
    path: "/csc369/paging",
    element: <SimplePaging />,
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

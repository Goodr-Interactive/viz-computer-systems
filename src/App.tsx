import type { JSX } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home, CSC369 } from "./pages";
import { Scheduler } from "./pages/csc369/components";

// operating system pages
import { SimplePaging } from "./pages/csc369/SimplePaging";

// computer architecture pages
import { CSC368 } from "./pages/csc368/CSC368";
import { Pipelining } from "./pages/csc368/pipelining";
import { DEADLOCK, MULTI_READER_WRITER, READER_WRITER, SIMPLE_MUTEX, Threads } from "./pages/csc369/components/threads";

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
    path: "/csc369/threads-reader-writer",
    title: "Threads – Reader & Writer",
    description: "",
    element: <Threads {...READER_WRITER} />
  },
  {
    path: "/csc369/threads-multi-reader-writer",
    title: "Threads – Multiple Reader & Single Writer",
    description: "",
    element: <Threads {...MULTI_READER_WRITER} />
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
    path: "/csc368/pipelining",
    title: "Instruction Pipelining",
    description: "",
    element: <Pipelining />,
  },
];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route key={"/"} element={<Home routes={ROUTES}/>} path="/"/>
        {ROUTES.map(({ element, path }) => (
          <Route key={path} element={element} path={path} />
        ))}
        
      </Routes>
    </BrowserRouter>
  );
}

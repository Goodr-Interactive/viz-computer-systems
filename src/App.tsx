import type { JSX } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages";

// operating system pages
import { SimplePaging } from "./pages/csc369/SimplePaging";

// computer architecture pages
import { CSC368 } from "./pages/csc368/CSC368";
import { Pipelining } from "./pages/csc368/pipelining/pipelining";
import { AdvancedLaundryPipelining } from "./pages/csc368/pipelining/laundry";
import { RegisterPipeline } from "./pages/csc368/pipelining/register-pipeline";
import { Caches } from "./pages/csc368/cache";

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
    element: <></>,
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
    path: "/csc368/caches",
    element: <Caches />,
  },
  {
    path: "/csc368/pipelining/registers",
    element: <RegisterPipeline />,
  },
  {
    path: "/csc368/pipelining/laundry",
    element: <AdvancedLaundryPipelining />,
  },
  {
    path: "/csc368/caches",
    element: <Caches />,
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

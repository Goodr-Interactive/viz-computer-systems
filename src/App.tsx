import type { JSX } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home, CSC368, Pipelining } from "./pages";

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

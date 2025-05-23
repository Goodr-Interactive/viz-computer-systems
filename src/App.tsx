import type { JSX } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages";
import { SimplePaging } from "./pages/csc369/SimplePaging";

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
    element: <></>,
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

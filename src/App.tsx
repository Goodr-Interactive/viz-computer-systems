import type { JSX } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages";
import { SimplePaging } from "./pages/csc369/SimplePaging";
import { TranslationExample } from "./pages/csc369/TranslationExample";
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
  {
    path: "/csc369/paging/translation",
    element: <TranslationExample />,
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

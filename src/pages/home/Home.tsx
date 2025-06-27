import React from "react";
import type { AppRoute } from "../../App";
import { partition } from "../csc369/components/scheduler/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface Props {
  routes: Array<AppRoute>;
}

export const Home: React.FunctionComponent<Props> = ({ routes }) => {
  const [csc369, csc368] = partition(routes, (route) => route.path.includes("csc369"));

  return (
    <div className="flex h-[100vh] w-full flex-col items-center gap-[24px] mt-[100px]">
      <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">
        Viz-Computer-Systems by Goodr Interactive
      </h1>
      <span>Select a Topic Below.</span>
      <div className="max-h-[100px]">
        <NavigationMenu viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>CSC368</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                  {csc368.map(({ path, title, description }) => (
                    <li className="row-span-3" key={path}>
                      <NavigationMenuLink asChild>
                        <a
                          className="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-linear-to-b p-6 no-underline outline-hidden select-none focus:shadow-md"
                          href={path}
                        >
                          <div className="mt-4 mb-2 text-lg font-medium">{title}</div>
                          <p className="text-muted-foreground text-sm leading-tight">
                            {description}
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>CSC369</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                  {csc369.map(({ path, title, description }) => (
                    <li className="row-span-3" key={path}>
                      <NavigationMenuLink asChild>
                        <a
                          className="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-linear-to-b p-6 no-underline outline-hidden select-none focus:shadow-md"
                          href={path}
                        >
                          <div className="mt-4 mb-2 text-lg font-medium">{title}</div>
                          <p className="text-muted-foreground text-sm leading-tight">
                            {description}
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
};

import React from "react";
import { cn } from "@/lib/utils";

export interface SubsectionHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export const SubsectionHeading: React.FC<SubsectionHeadingProps> = ({ children, className }) => (
  <h3 className={cn("mb-4 text-xl font-medium", className)}>{children}</h3>
);

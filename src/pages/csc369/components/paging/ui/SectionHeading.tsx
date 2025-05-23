import React from "react";

export interface SectionHeadingProps {
  children: React.ReactNode;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ children }) => (
  <h2 className="text-primary mb-6 text-2xl font-bold">{children}</h2>
); 
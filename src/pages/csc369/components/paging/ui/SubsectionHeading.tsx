import React from "react";

export interface SubsectionHeadingProps {
  children: React.ReactNode;
}

export const SubsectionHeading: React.FC<SubsectionHeadingProps> = ({ children }) => (
  <h3 className="mb-4 text-xl font-medium">{children}</h3>
); 
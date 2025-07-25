import React from "react";
import { PolicyComparisonVisualizer } from "./components/policies/PolicyComparisonVisualizer";

export const PagingPolicies: React.FC = () => {
  return (
    <div className="flex w-full flex-col items-center p-8 pb-24">
      <div className="flex w-full max-w-7xl flex-col items-center gap-10">
        <PolicyComparisonVisualizer />
      </div>
    </div>
  );
};

import React, { type PropsWithChildren } from "react";

interface Props {
  onClick: () => void;
}

export const IconButton: React.FunctionComponent<PropsWithChildren<Props>> = ({
  onClick,
  children,
}) => {
  return (
    <button onClick={onClick} className="cursor-pointer bg-transparent outline-none">
      {children}
    </button>
  );
};

import React, { type PropsWithChildren } from "react";

interface Props {
  onClick: () => void;
  disabled?: boolean;
}

export const IconButton: React.FunctionComponent<PropsWithChildren<Props>> = ({
  onClick,
  disabled = false,
  children,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer bg-transparent outline-none"
    >
      {children}
    </button>
  );
};

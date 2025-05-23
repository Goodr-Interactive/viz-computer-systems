import React from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";

export interface CollapsibleHeadingProps {
  children: React.ReactNode;
  collapsed: boolean;
  onClick: () => void;
}

export const CollapsibleHeading: React.FC<CollapsibleHeadingProps> = ({
  children,
  collapsed,
  onClick,
}) => (
  <div className="flex cursor-pointer items-center justify-between py-1" onClick={onClick}>
    <h3 className="text-xl font-medium select-none">{children}</h3>
    <motion.div
      animate={{ rotate: collapsed ? 0 : 180 }}
      initial={{ rotate: 0 }}
      transition={{ 
        duration: 0.3, 
        ease: "easeInOut",
        type: "tween"
      }}
      style={{ transformOrigin: "center" }}
    >
      <ChevronDown className="text-muted-foreground h-5 w-5" />
    </motion.div>
  </div>
); 
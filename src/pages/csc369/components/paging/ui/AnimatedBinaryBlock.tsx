import React from "react";
import { motion } from "motion/react";
import { BinaryBlock } from "../BinaryBlock"; // Adjust path as necessary
import type { BinaryBlockProps } from "../types"; // Adjust path as necessary

export interface AnimatedBinaryBlockProps extends BinaryBlockProps {
  layoutId?: string;
}

export const AnimatedBinaryBlock: React.FC<AnimatedBinaryBlockProps> = ({
  layoutId,
  ...props
}) => (
  <motion.div
    layoutId={layoutId}
    transition={{
      layout: { duration: 0.3, ease: "easeInOut" },
    }}
    layout
  >
    <BinaryBlock {...props} />
  </motion.div>
); 
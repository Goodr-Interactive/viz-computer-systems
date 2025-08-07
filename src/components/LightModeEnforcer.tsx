import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";

interface LightModeEnforcerProps {
  children: React.ReactNode;
}

export const LightModeEnforcer: React.FC<LightModeEnforcerProps> = ({
  children,
}) => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before checking theme to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Automatically force light mode when component mounts
  useEffect(() => {
    if (mounted && resolvedTheme === "dark") {
      setTheme("light");
    }
  }, [mounted, resolvedTheme, setTheme]);

  // Don't render anything on server-side or before mounting
  if (!mounted) {
    return null;
  }

  // Always render with light mode styling enforced
  return (
    <div className="light">
      {children}
    </div>
  );
};

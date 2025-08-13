import { cn } from "@/lib/utils";
import React from "react";

interface GridBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  gridSize?: number;
  fadeEdges?: boolean;
}

export function GridBackground({ 
  children, 
  className, 
  gridSize = 40, 
  fadeEdges = true 
}: GridBackgroundProps) {
  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "absolute inset-0",
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
        )}
        style={{
          backgroundSize: `${gridSize}px ${gridSize}px`,
        }}
      />
      {fadeEdges && (
        <div className="pointer-events-none absolute inset-0 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export function DotBackground({ 
  children, 
  className, 
  dotSize = 2, 
  spacing = 40,
  fadeEdges = true 
}: {
  children?: React.ReactNode;
  className?: string;
  dotSize?: number;
  spacing?: number;
  fadeEdges?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "absolute inset-0",
          "[background-image:radial-gradient(circle,#e4e4e7_1px,transparent_1px)]",
          "dark:[background-image:radial-gradient(circle,#262626_1px,transparent_1px)]"
        )}
        style={{
          backgroundSize: `${spacing}px ${spacing}px`,
        }}
      />
      {fadeEdges && (
        <div className="pointer-events-none absolute inset-0 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
} 
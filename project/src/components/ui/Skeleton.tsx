import React from "react";

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={[
        "animate-pulse rounded-lg bg-slate-200/70",
        className || "h-4 w-full",
      ].join(" ")}
    />
  );
};


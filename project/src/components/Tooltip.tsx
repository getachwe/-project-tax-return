import React from "react";

export const Tooltip: React.FC<{ content: string }> = ({ content }) => (
  <span className="relative group inline-block">
    <svg
      className="w-4 h-4 text-blue-500 cursor-pointer ml-1 inline align-middle"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      aria-hidden="true"
      tabIndex={0}
      focusable="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" />
      <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor" fontFamily="inherit">i</text>
    </svg>
    <span className="absolute z-20 bottom-full mb-2 right-1/2 translate-x-1/2 w-max max-w-xs px-3 py-2 rounded bg-gray-900 text-white text-xs opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none whitespace-pre-line shadow-lg rtl:right-auto rtl:left-1/2 rtl:-translate-x-1/2">
      {content}
    </span>
  </span>
); 
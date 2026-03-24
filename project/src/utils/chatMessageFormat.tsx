import React from "react";

/**
 * ממיר **הדגשה** בסגנון Markdown ל־<strong> — בלי ספריית markdown מלאה.
 */
export function renderChatMarkdown(
  text: string,
  variant: "user" | "assistant",
): React.ReactNode {
  if (!text) return null;
  const strongClass =
    variant === "user"
      ? "font-semibold text-white"
      : "font-semibold text-slate-900";

  const lines = text.split("\n");
  return lines.map((line, lineIndex) => (
    <React.Fragment key={lineIndex}>
      {lineIndex > 0 ? <br /> : null}
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) => {
        if (
          part.startsWith("**") &&
          part.endsWith("**") &&
          part.length >= 4
        ) {
          const inner = part.slice(2, -2);
          return (
            <strong key={partIndex} className={strongClass}>
              {inner}
            </strong>
          );
        }
        return <span key={partIndex}>{part}</span>;
      })}
    </React.Fragment>
  ));
}

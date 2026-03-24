import React from "react";
import { Link } from "react-router-dom";

/**
 * נתיבי SPA מותרים בקישורי צ'אט (מניעת javascript: וכו')
 */
function isSafeChatLinkHref(href: string): boolean {
  const h = href.trim();
  if (!h.startsWith("/") || h.includes("//") || h.includes("..")) {
    return false;
  }
  return /^\/$|^\/(incomes|history|assistant|settings|profile|results)$/.test(
    h,
  );
}

function renderBoldSegments(
  text: string,
  variant: "user" | "assistant",
): React.ReactNode {
  const strongClass =
    variant === "user"
      ? "font-semibold text-white"
      : "font-semibold text-slate-900";

  return text.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) => {
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
  });
}

/**
 * שורה אחת: קישורי Markdown [תווית](/path) + **הדגשה**
 */
function renderChatLine(
  line: string,
  variant: "user" | "assistant",
  lineKey: string,
): React.ReactNode {
  const linkClass =
    variant === "user"
      ? "underline font-medium text-white decoration-white/80 hover:decoration-white"
      : "underline font-medium text-[#006D4E] decoration-[#006D4E]/50 hover:text-[#00533c] hover:decoration-[#00533c]";

  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = linkRe.exec(line)) !== null) {
    if (m.index > last) {
      nodes.push(
        <span key={`${lineKey}-${k++}`}>
          {renderBoldSegments(line.slice(last, m.index), variant)}
        </span>,
      );
    }
    const label = m[1];
    const href = m[2];
    if (isSafeChatLinkHref(href)) {
      nodes.push(
        <Link
          key={`${lineKey}-${k++}`}
          to={href.trim()}
          className={linkClass}
        >
          {label}
        </Link>,
      );
    } else {
      nodes.push(
        <span key={`${lineKey}-${k++}`}>
          {renderBoldSegments(m[0], variant)}
        </span>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < line.length) {
    nodes.push(
      <span key={`${lineKey}-${k++}`}>
        {renderBoldSegments(line.slice(last), variant)}
      </span>,
    );
  }
  return <>{nodes}</>;
}

/**
 * **הדגשה** בסגנון Markdown + קישורים פנימיים [תווית](/path)
 */
export function renderChatMarkdown(
  text: string,
  variant: "user" | "assistant",
): React.ReactNode {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, lineIndex) => (
    <React.Fragment key={lineIndex}>
      {lineIndex > 0 ? <br /> : null}
      {renderChatLine(line, variant, `L${lineIndex}`)}
    </React.Fragment>
  ));
}

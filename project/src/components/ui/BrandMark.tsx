import React from "react";

const sizeStyles = {
  sm: {
    box: "h-9 w-9 min-h-[2.25rem] min-w-[2.25rem] rounded-xl text-[0.95rem]",
    title: "text-sm",
    gap: "gap-2.5",
  },
  md: {
    box: "h-11 w-11 min-h-[2.75rem] min-w-[2.75rem] rounded-2xl text-xl",
    title: "text-base sm:text-[1.05rem]",
    gap: "gap-3",
  },
  lg: {
    box: "h-12 w-12 min-h-[3rem] min-w-[3rem] rounded-2xl text-2xl",
    title: "text-lg sm:text-xl",
    gap: "gap-3.5",
  },
} as const;

export type BrandLogoSize = keyof typeof sizeStyles;

/** סימול מותג — אות א׳ על גרדיאנט וצל עדין */
export const BrandLogoIcon: React.FC<{
  size?: BrandLogoSize;
  className?: string;
}> = ({ size = "md", className = "" }) => {
  const s = sizeStyles[size];
  return (
    <div
      className={[
        "relative shrink-0 flex items-center justify-center font-extrabold text-white select-none",
        "bg-gradient-to-br from-[#00b57d] via-[#006D4E] to-[#023d2c]",
        "shadow-[0_8px_24px_-6px_rgba(0,109,78,0.45)] ring-1 ring-white/35 ring-inset",
        s.box,
        className,
      ].join(" ")}
      aria-hidden
    >
      <span
        className="leading-none tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.22)]"
        style={{ fontFamily: "inherit" }}
      >
        א
      </span>
      <span
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/[0.22] from-0% via-transparent via-35% to-transparent"
        aria-hidden
      />
    </div>
  );
};

type BrandLockupProps = {
  title: string;
  subtitle?: string;
  size?: BrandLogoSize;
  className?: string;
};

/**
 * לוגו + שם — ב־RTL: האייקון בצד הקריאה (ימין), הטקסט משמאלו.
 * סדר ב־DOM: אייקון ראשון כדי שיישב נכון תחת dir=rtl.
 */
export const BrandLockup: React.FC<BrandLockupProps> = ({
  title,
  subtitle,
  size = "md",
  className = "",
}) => {
  const s = sizeStyles[size];
  return (
    <div className={["flex items-start", s.gap, className].join(" ")}>
      <BrandLogoIcon size={size} />
      <div className="min-w-0 flex-1 text-right pt-0.5">
        <p
          className={[
            "font-extrabold tracking-tight leading-snug text-[#00523c] dark:text-emerald-200",
            s.title,
          ].join(" ")}
        >
          {title}
        </p>
        {subtitle ? (
          <p className="mt-1 text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 leading-snug tracking-wide">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
};

import React from "react";

interface InposLogoProps {
  className?: string;
  variant?: "navy" | "white" | "auto";
  height?: number | string;
}

export const InposLogo: React.FC<InposLogoProps> = ({
  className = "h-8",
  variant = "navy",
  height,
}) => {
  const textColor = variant === "white" ? "#FFFFFF" : "#162456";

  return (
    <div className={`inline-flex items-center select-none ${className}`} style={height ? { height } : undefined}>
      <svg
        viewBox="0 0 540 160"
        className="h-full w-auto max-w-full drop-shadow-sm"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
      >
        {/* Letter 'i' Orange Tittle (Leaf / Petal dot) */}
        <path
          d="M 38,26 L 68,26 L 68,62 C 68,62 48,60 38,44 C 36,40 37,30 38,26 Z"
          fill="#EA5A27"
        />

        {/* Letter 'i' Stem */}
        <rect
          x="38"
          y="72"
          width="30"
          height="82"
          rx="5"
          fill={textColor}
        />

        {/* Letter 'N' */}
        <path
          d="M 86,72 L 118,72 L 170,126 L 170,72 L 200,72 L 200,154 L 168,154 L 116,100 L 116,154 L 86,154 Z"
          fill={textColor}
        />

        {/* Letter 'P' */}
        <path
          d="M 218,72 L 272,72 C 298,72 316,86 316,108 C 316,130 298,144 272,144 L 248,144 L 248,154 L 218,154 Z M 248,96 L 248,120 L 269,120 C 279,120 286,115 286,108 C 286,101 279,96 269,96 Z"
          fill={textColor}
        />

        {/* Letter 'O' */}
        <path
          d="M 380,70 C 412,70 436,92 436,113 C 436,134 412,156 380,156 C 348,156 324,134 324,113 C 324,92 348,70 380,70 Z M 380,94 C 365,94 353,103 353,113 C 353,123 365,132 380,132 C 395,132 407,123 407,113 C 407,103 395,94 380,94 Z"
          fill={textColor}
        />

        {/* Letter 'S' */}
        <path
          d="M 454,86 C 454,77 465,72 478,72 C 493,72 505,79 507,90 L 482,95 C 481,93 478,90 475,90 C 472,90 470,92 470,94 C 470,103 514,103 514,129 C 514,146 498,156 478,156 C 458,156 446,146 444,134 L 470,130 C 471,133 474,137 478,137 C 482,137 486,134 486,130 C 486,120 442,120 442,97 C 442,91 447,86 454,86 Z"
          fill={textColor}
        />
      </svg>
    </div>
  );
};

export default InposLogo;

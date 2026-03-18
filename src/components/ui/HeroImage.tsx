import { type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeroImageProps {
  imageUrl: string;
  height?: string;
  overlay: "dark" | "orange" | "split";
  children: ReactNode;
}

const overlayStyles: Record<string, string> = {
  dark: "rgba(10,18,32,0.75)",
  orange: "linear-gradient(to right, rgba(10,18,32,0.85), rgba(232,149,26,0.15))",
  split: "linear-gradient(to right, rgba(10,18,32,0.90) 0%, rgba(10,18,32,0.90) 55%, rgba(10,18,32,0.3) 55%, rgba(10,18,32,0.3) 100%)",
};

const HeroImage = ({ imageUrl, height = "500px", overlay, children }: HeroImageProps) => {
  const isMobile = useIsMobile();
  const effectiveOverlay = isMobile && overlay === "split" ? "dark" : overlay;
  const bg = overlayStyles[effectiveOverlay];
  const isGradient = effectiveOverlay !== "dark";

  // Mobile: reduce height to 65%
  const computedHeight = isMobile && height !== "100vh"
    ? `calc(${height} * 0.65)`
    : height;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: computedHeight }}
    >
      {/* Background image with Ken Burns */}
      <img
        src={imageUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover animate-ken-burns"
      />

      {/* Overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: isGradient ? bg : undefined,
          backgroundColor: !isGradient ? bg : undefined,
        }}
      />

      {/* Content */}
      <div className="relative z-[2] flex h-full w-full items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default HeroImage;

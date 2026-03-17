import logoOnWhite from "@/assets/logo-on-white.png";
import logoOnDark from "@/assets/logo-on-dark.png";

interface LogoProps {
  variant?: "on-navy" | "on-white";
  className?: string;
}

const Logo = ({ variant = "on-white", className = "" }: LogoProps) => {
  const src = variant === "on-navy" ? logoOnDark : logoOnWhite;
  return (
    <img
      src={src}
      alt="360 Lateral"
      className={`h-8 w-auto object-contain ${className}`}
    />
  );
};

export default Logo;

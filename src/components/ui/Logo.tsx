import logoImg from "@/assets/logo-360lateral.png";

interface LogoProps {
  variant?: "on-navy" | "on-white";
  className?: string;
}

const Logo = ({ variant = "on-white", className = "" }: LogoProps) => {
  return (
    <img
      src={logoImg}
      alt="360 Lateral"
      className={`h-8 w-auto object-contain ${className}`}
    />
  );
};

export default Logo;

interface LogoProps {
  variant?: "on-navy" | "on-white";
  className?: string;
}

const Logo = ({ variant = "on-white", className = "" }: LogoProps) => {
  const lateralColor = variant === "on-navy" ? "text-primary-foreground" : "text-navy";

  return (
    <span className={`inline-flex items-center font-body font-extrabold text-xl tracking-tight ${className}`}>
      <span className="bg-orange px-1.5 py-0.5 rounded text-primary-foreground mr-0.5">360</span>
      <span className={lateralColor}>LATERAL</span>
    </span>
  );
};

export default Logo;

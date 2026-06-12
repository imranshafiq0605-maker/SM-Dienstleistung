import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  label?: string;
  compact?: boolean;
};

export function BrandLogo({ href = "/", label, compact = false }: BrandLogoProps) {
  const content = (
    <>
      <span className={`brand-logo-mark ${compact ? "h-10 w-10" : "h-12 w-36"}`}>
        <Image
          alt="CreatorFlow"
          className="h-full w-full object-contain"
          height={120}
          priority
          src="/creatorflow-logo.jpeg"
          width={360}
        />
      </span>
      {label ? (
        <span className="min-w-0">
          <span className="block text-xl font-black tracking-tight text-zinc-950">
            {label}
          </span>
        </span>
      ) : null}
    </>
  );

  return (
    <Link className="brand-logo-link inline-flex items-center gap-3" href={href}>
      {content}
    </Link>
  );
}

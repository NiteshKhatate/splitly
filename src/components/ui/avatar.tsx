import Image from "next/image";

type AvatarProps = {
  name: string;
  src?: string | null;
};

export function Avatar({ name, src }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "S";

  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={40}
        height={40}
        unoptimized
        className="size-10 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-label text-primary"
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

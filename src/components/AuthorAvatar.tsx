// The author's photo, or their initials until a photo is added.
export function AuthorAvatar({ name, initials, image, size }: { name: string; initials: string; image: string | null; size: number }) {
  if (image)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name} width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-accent font-display font-bold text-accent-ink"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

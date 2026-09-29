import Link from "next/link";
import { Surface } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="app-grid flex min-h-screen items-center justify-center px-4 py-6">
      <Surface className="max-w-lg p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">
          404
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          This booking surface could not be found.
        </h1>
        <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
          The route may have been unpublished, the slug may be stale, or the
          event is no longer shareable.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-[color:var(--brand)] px-5 py-3 text-sm font-semibold text-white"
        >
          Return home
        </Link>
      </Surface>
    </main>
  );
}

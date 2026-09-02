import { Compass } from "lucide-react";
import { Seo } from "@/lib/seo";
import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <Seo title="Page not found" noIndex />
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <Compass className="h-10 w-10" />
      </div>
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">404</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Page not found</h1>
      <p className="mt-3 text-sm text-zinc-500">The page you're looking for doesn't exist or has been moved.</p>
      <div className="mt-8 flex gap-3">
        <LinkButton to="/">Go home</LinkButton>
        <LinkButton to="/courses" variant="outline">
          Browse courses
        </LinkButton>
      </div>
    </div>
  );
}

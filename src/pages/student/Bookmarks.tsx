import { Link } from "react-router-dom";
import { Bookmark as BookmarkIcon } from "lucide-react";
import { Seo } from "@/lib/seo";
import { useAuth } from "@/hooks/useAuth";
import { useBookmarks, useCourses } from "@/hooks/queries";
import { CourseGrid } from "@/components/course";
import { Card, LinkButton, PageHeader } from "@/components/ui";

export default function Bookmarks() {
  const { user } = useAuth();
  const { data: bookmarks = [], isLoading } = useBookmarks(user?.id);
  const { data: courses = [] } = useCourses();
  const saved = bookmarks
    .map((b) => courses.find((c) => c.id === b.course_id))
    .filter((c): c is NonNullable<typeof c> => !!c && c.status === "published");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Seo title="Saved courses" noIndex />
      <PageHeader eyebrow="Library" title="Saved courses" description="Courses you bookmarked for later." />

      {!isLoading && saved.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <BookmarkIcon className="h-10 w-10 text-zinc-300" />
          <p className="text-lg font-semibold">Nothing saved yet</p>
          <p className="max-w-sm text-sm text-zinc-500">
            Tap the <BookmarkIcon className="inline h-4 w-4" /> button on any course to keep it here.
          </p>
          <LinkButton to="/courses" className="mt-2">
            Browse courses
          </LinkButton>
        </Card>
      ) : (
        <CourseGrid courses={saved} loading={isLoading} skeletons={4} />
      )}

      {saved.length > 0 && (
        <p className="mt-8 text-center text-xs text-zinc-400">
          Tip: bookmarks sync with your account — sign in on any device to see them.
          {user && (
            <>
              {" "}
              <Link to="/dashboard" className="text-primary hover:underline">
                Back to dashboard
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}

import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import {
  backupApi,
  bookmarksApi,
  categoriesApi,
  contactApi,
  coursesApi,
  lessonsApi,
  logsApi,
  mediaApi,
  newsletterApi,
  pagesApi,
  pdfsApi,
  progressApi,
  resourcesApi,
  settingsApi,
  statsApi,
  usersApi,
} from "@/services/api";
import { DEFAULT_SETTINGS } from "@/data/seed";
import type { SettingsSection, SiteSettings } from "@/types";

export const qk = {
  settings: ["settings"] as const,
  categories: ["categories"] as const,
  courses: (includeDrafts = false) => ["courses", { includeDrafts }] as const,
  course: (slug: string) => ["course", slug] as const,
  courseById: (id: string) => ["course-id", id] as const,
  content: (courseId: string) => ["course-content", courseId] as const,
  pages: ["pages"] as const,
  page: (slug: string) => ["page", slug] as const,
  users: ["users"] as const,
  media: ["media"] as const,
  logs: ["logs"] as const,
  stats: ["stats"] as const,
};

export function useSettings() {
  return useQuery<SiteSettings>({
    queryKey: qk.settings,
    queryFn: settingsApi.get,
    staleTime: 30_000,
    placeholderData: DEFAULT_SETTINGS,
  });
}

export function useCategories() {
  return useQuery({ queryKey: qk.categories, queryFn: categoriesApi.list, staleTime: 30_000 });
}

export function useCourses(includeDrafts = false) {
  return useQuery({ queryKey: qk.courses(includeDrafts), queryFn: () => coursesApi.list({ includeDrafts }), staleTime: 15_000 });
}

export function useCourse(slug: string | undefined) {
  return useQuery({ queryKey: qk.course(slug ?? ""), queryFn: () => coursesApi.getBySlug(slug ?? ""), enabled: !!slug, staleTime: 30_000 });
}

export function useCourseById(id: string | undefined) {
  return useQuery({ queryKey: qk.courseById(id ?? ""), queryFn: () => coursesApi.getById(id ?? ""), enabled: !!id && id !== "new", staleTime: 60_000 });
}

export function useCourseContent(courseId: string | undefined) {
  return useQuery({ queryKey: qk.content(courseId ?? ""), queryFn: () => coursesApi.content(courseId ?? ""), enabled: !!courseId, staleTime: 15_000 });
}

export function usePages() {
  return useQuery({ queryKey: qk.pages, queryFn: pagesApi.list, staleTime: 30_000 });
}

export function usePage(slug: string | undefined) {
  return useQuery({ queryKey: qk.page(slug ?? ""), queryFn: () => pagesApi.get(slug ?? ""), enabled: !!slug, staleTime: 30_000 });
}

export function useUsers() {
  return useQuery({ queryKey: qk.users, queryFn: usersApi.list, staleTime: 30_000 });
}

export function useMedia() {
  return useQuery({ queryKey: qk.media, queryFn: mediaApi.list, staleTime: 30_000 });
}

export function useLogs() {
  return useQuery({ queryKey: qk.logs, queryFn: () => logsApi.list(150), staleTime: 10_000 });
}

export function useStats() {
  return useQuery({ queryKey: qk.stats, queryFn: statsApi.get, staleTime: 15_000 });
}

/** Generic mutation helper that invalidates the given query keys on success. */
export function useMutate<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>, invalidate: QueryKey[] = []) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await Promise.all(
        [...invalidate, qk.stats, qk.logs].map((key) =>
          qc.invalidateQueries({ queryKey: key, refetchType: "all" })
        )
      );
    },
  });
}

export function useSaveSettings<K extends SettingsSection>(section: K) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (value: SiteSettings[K]) => {
      await settingsApi.save(section, value);
      return value;
    },
    onMutate: async (newValue) => {
      await qc.cancelQueries({ queryKey: qk.settings });
      const previous = qc.getQueryData<SiteSettings>(qk.settings);
      if (previous) {
        qc.setQueryData<SiteSettings>(qk.settings, {
          ...previous,
          [section]: newValue,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(qk.settings, context.previous);
      }
    },
    onSettled: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.settings, refetchType: "all" }),
        qc.invalidateQueries({ queryKey: qk.stats, refetchType: "all" }),
        qc.invalidateQueries({ queryKey: qk.logs, refetchType: "all" }),
      ]);
    },
  });
}

const contentKeys = (courseId: string) => [qk.content(courseId), ["courses"], ["course"]];

export function useBookmarks(userId?: string | null) {
  return useQuery({ queryKey: ["bookmarks", userId ?? "anon"], queryFn: () => bookmarksApi.list(userId as string), enabled: !!userId });
}

export function useToggleBookmark(userId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => bookmarksApi.toggle(userId as string, courseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmarks"] }),
  });
}

export function useLessonProgress(userId?: string | null, courseId?: string) {
  return useQuery({ queryKey: ["progress", userId ?? "anon", courseId ?? "all"], queryFn: () => progressApi.list(userId as string, courseId), enabled: !!userId });
}

export function useToggleLesson(userId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { lessonId: string; courseId: string }) => progressApi.toggle(userId as string, args.lessonId, args.courseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["progress"] }),
  });
}

export function useContact() {
  return useMutation({ mutationFn: contactApi.submit });
}

export function useNewsletter() {
  return useMutation({ mutationFn: newsletterApi.subscribe });
}

export const mutations = {
  useSaveCategory: () => useMutate(categoriesApi.save, [qk.categories, ["courses"]]),
  useDeleteCategory: () => useMutate(categoriesApi.remove, [qk.categories, ["courses"]]),
  useSaveCourse: () => useMutate(coursesApi.save, [["courses"], ["course"], ["course-id"]]),
  useDeleteCourse: () => useMutate(coursesApi.remove, [["courses"], ["course"], ["course-id"]]),
  useSaveLesson: (courseId: string) => useMutate(lessonsApi.save, contentKeys(courseId)),
  useDeleteLesson: (courseId: string) => useMutate(lessonsApi.remove, contentKeys(courseId)),
  useReorderLessons: (courseId: string) => useMutate(lessonsApi.reorder, contentKeys(courseId)),
  useSavePdf: (courseId: string) => useMutate(pdfsApi.save, contentKeys(courseId)),
  useDeletePdf: (courseId: string) => useMutate(pdfsApi.remove, contentKeys(courseId)),
  useReorderPdfs: (courseId: string) => useMutate(pdfsApi.reorder, contentKeys(courseId)),
  useSaveResource: (courseId: string) => useMutate(resourcesApi.save, contentKeys(courseId)),
  useDeleteResource: (courseId: string) => useMutate(resourcesApi.remove, contentKeys(courseId)),
  useReorderResources: (courseId: string) => useMutate(resourcesApi.reorder, contentKeys(courseId)),
  useSavePage: () => useMutate(pagesApi.save, [qk.pages, ["page"]]),
  useDeletePage: () => useMutate(pagesApi.remove, [qk.pages, ["page"]]),
  useUpdateUser: () => useMutate(({ id, patch }: { id: string; patch: Parameters<typeof usersApi.update>[1] }) => usersApi.update(id, patch), [qk.users]),
  useDeleteUser: () => useMutate(usersApi.remove, [qk.users]),
  useAddMedia: () => useMutate(mediaApi.add, [qk.media]),
  useDeleteMedia: () => useMutate(mediaApi.remove, [qk.media]),
  useClearLogs: () => useMutate(logsApi.clear, [qk.logs]),
  useImportBackup: () => useMutate(backupApi.importAll, [qk.settings, qk.categories, ["courses"], ["course"], ["course-content"], qk.pages, ["page"], qk.media, qk.users]),
};


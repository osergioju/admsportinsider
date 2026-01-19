import { Skeleton } from "../components/uxui/skeleton";

export default function LoadingSkeleton() {
  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 p-10 space-y-6">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-6 w-2/3" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}

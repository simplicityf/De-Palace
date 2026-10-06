import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Pagination({
  pathname,
  params,
  page,
  totalPages,
}: {
  pathname: string;
  params: URLSearchParams;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => {
    const next = new URLSearchParams(params);
    if (target > 1) next.set("page", String(target));
    else next.delete("page");
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)}>
          <Button variant="outline" size="sm">Previous</Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>Previous</Button>
      )}
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)}>
          <Button variant="outline" size="sm">Next</Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>Next</Button>
      )}
    </nav>
  );
}

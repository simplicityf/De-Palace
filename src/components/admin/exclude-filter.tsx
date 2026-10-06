type ExcludeGroup = {
  id: string;
  name: string;
  items: { id: string; name: string }[];
};

/**
 * Plain checkboxes inside a GET form: checked categories submit as `xCat`,
 * checked items as `xItem`. No client JS needed.
 */
export function ExcludeFilter({
  groups,
  excludeItems,
  excludeCategories,
}: {
  groups: ExcludeGroup[];
  excludeItems: string[];
  excludeCategories: string[];
}) {
  const count = excludeItems.length + excludeCategories.length;

  return (
    <div className="space-y-1">
      <span className="text-sm font-medium">Exclude</span>
      <details className="group relative">
        <summary className="flex h-9 w-full sm:w-48 cursor-pointer list-none items-center justify-between rounded-md border bg-white px-3 text-sm">
          <span className={count > 0 ? "text-foreground" : "text-muted-foreground"}>
            {count > 0 ? `${count} excluded` : "Nothing excluded"}
          </span>
          <span className="text-muted-foreground transition-transform group-open:rotate-180">▾</span>
        </summary>
        <div className="absolute z-20 mt-1 max-h-80 w-full sm:w-72 overflow-y-auto rounded-md border bg-white p-2 shadow-lg">
          {groups.length === 0 && (
            <p className="p-2 text-sm text-muted-foreground">No stock items.</p>
          )}
          {groups.map((group) => (
            <div key={group.id} className="py-1">
              <label className="flex items-center gap-2 rounded px-2 py-1 text-sm font-medium hover:bg-brand-green/5">
                <input
                  type="checkbox"
                  name="xCat"
                  value={group.id}
                  defaultChecked={excludeCategories.includes(group.id)}
                />
                {group.name}
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  whole category
                </span>
              </label>
              {group.items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2 rounded py-1 pl-7 pr-2 text-sm hover:bg-brand-green/5"
                >
                  <input
                    type="checkbox"
                    name="xItem"
                    value={item.id}
                    defaultChecked={excludeItems.includes(item.id)}
                  />
                  <span className="truncate">{item.name}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

"use client";

import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@flack/ui/components/button";
import { Input } from "@flack/ui/components/input";
import { DataTableViewOptions } from "@flack/ui/components/data-table-view-options";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  /** Additional filter controls (renders on the left side) */
  children?: React.ReactNode;
  /** Action buttons like "Add Item" (renders on the right side) */
  actions?: React.ReactNode;
}

function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Search...",
  children,
  actions,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}
        {children}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 size-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <DataTableViewOptions table={table} />
        {actions}
      </div>
    </div>
  );
}

export { DataTableToolbar };

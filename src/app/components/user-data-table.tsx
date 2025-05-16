"use client"

import * as React from "react"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
  CellContext,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Search, CalendarPlus, CheckCircle, Flame, Filter, ChevronDown, XCircle } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Json } from "@/types/supabase"

export interface UserWithStatus {
  id: string
  name: string | null
  division: string
  quota: number
  pickedUp: number
  isCompleted: boolean
  avatar_config: Json | null
}

interface UserDataTableProps {
  data: UserWithStatus[]
  onRecordPickup: (user: UserWithStatus) => void
}

export function UserDataTable({ data, onRecordPickup }: UserDataTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [filterDivision, setFilterDivision] = React.useState<string | null>(null)
  const [isFilterOpen, setIsFilterOpen] = React.useState(false)

  // Get all unique divisions
  const divisions = React.useMemo(() => {
    const set = new Set<string>()
    data.forEach(user => set.add(user.division))
    return Array.from(set).sort()
  }, [data])

  // Filter users by division
  const filteredData = React.useMemo(() => {
    if (!filterDivision) return data
    return data.filter(user => user.division === filterDivision)
  }, [data, filterDivision])

  const columns = React.useMemo<ColumnDef<UserWithStatus, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: () => <div className="flex items-center gap-1">Name</div>,
        cell: (info: CellContext<UserWithStatus, unknown>) => <span className="font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "quota",
        header: "Quota",
        cell: (info: CellContext<UserWithStatus, unknown>) => <span>{info.getValue() as number} sacks</span>,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }: { row: { original: UserWithStatus } }) => {
          const user = row.original
          return (
            <div className="flex items-center gap-2">
              <Progress value={(user.pickedUp / user.quota) * 100} className="h-2 w-24" />
              <div>{user.pickedUp} of {user.quota}</div>
              {user.isCompleted && (
                <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
              )}
              {!user.isCompleted && user.pickedUp > 0 && (
                <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                  <Flame className="mr-1 h-3 w-3" />
                  In Progress
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: { original: UserWithStatus } }) => {
          const user = row.original
          return !user.isCompleted ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRecordPickup(user)}
              className="flex items-center gap-1"
            >
              <CalendarPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Record Pickup</span>
              <span className="sm:hidden">Record</span>
            </Button>
          ) : null
        },
      },
    ],
    [onRecordPickup]
  )

  const table = useReactTable<UserWithStatus>({
    data: filteredData,
    columns,
    state: {
      globalFilter,
      rowSelection,
    },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  })

  // Get filtered/sorted rows for grouping
  const rows = table.getRowModel().rows

  // Group rows by division
  const groupedRows: Record<string, typeof rows> = {}
  rows.forEach(row => {
    const division = row.original.division
    if (!groupedRows[division]) groupedRows[division] = []
    groupedRows[division].push(row)
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative md:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search users or divisions..."
            value={globalFilter ?? ""}
            onChange={e => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                Filter by Division
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="end">
              <Command>
                <CommandInput placeholder="Search division..." />
                <CommandList>
                  <CommandEmpty>No division found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem 
                      onSelect={() => {
                        setFilterDivision(null)
                        setIsFilterOpen(false)
                      }}
                      className="flex items-center justify-between"
                    >
                      <span>All Divisions</span>
                      {!filterDivision && <CheckCircle className="h-4 w-4" />}
                    </CommandItem>
                    {divisions.map((division) => (
                      <CommandItem
                        key={division}
                        onSelect={() => {
                          setFilterDivision(division)
                          setIsFilterOpen(false)
                        }}
                        className="flex items-center justify-between"
                      >
                        <span>{division}</span>
                        {filterDivision === division && <CheckCircle className="h-4 w-4" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {filterDivision && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setFilterDivision(null)}
              title="Clear filter"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">
                <input
                  type="checkbox"
                  checked={table.getIsAllRowsSelected()}
                  onChange={table.getToggleAllRowsSelectedHandler()}
                  aria-label="Select all"
                />
              </TableHead>
              {table.getHeaderGroups()[0].headers.map(header => (
                <TableHead key={header.id} className="text-left font-medium">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedRows).map(([division, divisionRows]) => (
              <React.Fragment key={division}>
                <TableRow className="bg-primary/90 text-primary-foreground group-division-row">
                  <TableCell colSpan={columns.length + 1} className="py-2 px-4 font-medium !bg-primary/90 !text-primary-foreground">
                    {division}
                  </TableCell>
                </TableRow>
                {divisionRows.map(row => (
                  <TableRow key={row.id} className="hover:bg-muted/30">
                    <TableCell className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                      />
                    </TableCell>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="py-3 px-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="py-4 text-center text-muted-foreground">
                  No results found. Try adjusting your search or filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
} 
'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { Label } from '@/components/ui/label'
import { Profile } from '@/types/supabase'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CalendarIcon } from 'lucide-react'

interface PickupLog {
  id: string
  quantity: number
  pickup_date: string
  year: number
  month: number
}

interface HistoryTableProps {
  years: number[]
  pickupsByMonth: Record<string, PickupLog[]>
  quota: number
  user: Profile
}

export default function HistoryTable({ years, pickupsByMonth, quota }: HistoryTableProps) {
  const [selectedYear, setSelectedYear] = useState<number | null>(years[0] || null)
  const [editingPickup, setEditingPickup] = useState<PickupLog | null>(null)
  const [deletingPickup, setDeletingPickup] = useState<PickupLog | null>(null)
  const [editQuantity, setEditQuantity] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [editDate, setEditDate] = useState<string>('')
  const supabase = createClient()
  const router = useRouter()
  
  // Memoize month names to prevent recreation on each render
  const monthNames = useMemo(() => [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ], [])
  
  // Memoize months for selected year
  const months = useMemo(() => 
    selectedYear 
      ? Array.from({ length: 12 }, (_, i) => i + 1)
          .sort((a, b) => b - a)
      : [],
    [selectedYear]
  )
  
  // Memoize total calculation function
  const getTotalForMonth = useCallback((year: number, month: number) => {
    const key = `${year}-${month}`
    const logs = pickupsByMonth[key] || []
    return logs.reduce((sum, log) => sum + log.quantity, 0)
  }, [pickupsByMonth])
  
  // Memoize month completion check
  const isMonthCompleted = useCallback((year: number, month: number) => {
    return getTotalForMonth(year, month) >= quota
  }, [getTotalForMonth, quota])

  const handleDelete = useCallback((pickup: PickupLog) => {
    setDeletingPickup(pickup)
  }, [])

  const handleEdit = useCallback((pickup: PickupLog) => {
    setEditingPickup(pickup)
    setEditQuantity(pickup.quantity.toString())
    setEditDate(pickup.pickup_date ? pickup.pickup_date.split('T')[0] : '')
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingPickup) return

    setIsLoading(true)
    try {
      const { error: deleteError } = await supabase
        .from('pickups')
        .delete()
        .eq('id', deletingPickup.id)

      if (deleteError) throw deleteError

      toast.success('Pickup deleted successfully')
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete pickup')
    } finally {
      setIsLoading(false)
      setDeletingPickup(null)
    }
  }, [deletingPickup, router, supabase])

  const handleSaveEdit = useCallback(async () => {
    if (!editingPickup) return

    const key = `${editingPickup.year}-${editingPickup.month}`
    const logs = pickupsByMonth[key] || []
    const currentTotal = logs.reduce((sum, log) => {
      if (log.id === editingPickup.id) return sum
      return sum + log.quantity
    }, 0)
    const newTotal = currentTotal + Number(editQuantity)

    if (newTotal > quota) {
      toast.error(`Cannot exceed monthly quota of ${quota} sacks`)
      return
    }

    setIsLoading(true)
    try {
      const { error: updateError } = await supabase
        .from('pickups')
        .update({ 
          quantity: Number(editQuantity), 
          pickup_date: editDate 
        })
        .eq('id', editingPickup.id)

      if (updateError) throw updateError

      toast.success('Pickup updated successfully')
      router.refresh()
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update pickup')
    } finally {
      setIsLoading(false)
      setEditingPickup(null)
    }
  }, [editingPickup, editQuantity, editDate, pickupsByMonth, quota, router, supabase])

  // Memoize year buttons to prevent unnecessary re-renders
  const yearButtons = useMemo(() => (
    <div className="flex flex-wrap gap-2">
      {years.map(year => (
        <Button
          key={year}
          variant={selectedYear === year ? 'default' : 'outline'}
          onClick={() => setSelectedYear(year)}
          size="sm"
        >
          {year}
        </Button>
      ))}
    </div>
  ), [years, selectedYear])

  // Memoize table rows to prevent unnecessary re-renders
  const tableRows = useMemo(() => (
    months.map(month => {
      const key = `${selectedYear}-${month}`
      const logs = pickupsByMonth[key] || []
      const total = getTotalForMonth(selectedYear!, month)
      const completed = isMonthCompleted(selectedYear!, month)
      
      return (
        <tr key={month} className="hover:bg-muted/30">
          <td className="py-3 px-4 font-medium">{monthNames[month - 1]}</td>
          <td className="py-3 px-4">
            {completed ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Completed
              </span>
            ) : logs.length > 0 ? (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                In Progress
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                Not Started
              </span>
            )}
          </td>
          <td className="py-3 px-4">
            {total} of {quota} sacks
          </td>
          <td className="py-3 px-4">
            {logs.length === 0 ? (
              <span className="text-muted-foreground">No pickups</span>
            ) : (
              <div className="space-y-1">
                {logs.map(log => (
                  <div key={log.id} className="flex items-center justify-between text-xs">
                    <span>
                      {log.quantity} sack{log.quantity > 1 ? 's' : ''}
                      {' at '}
                      {log.pickup_date && !isNaN(new Date(log.pickup_date).getTime())
                      ? format(new Date(log.pickup_date), 'MMM d, yyyy')
                      : '—'}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleEdit(log)}
                        disabled={isLoading}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => handleDelete(log)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )
    })
  ), [months, selectedYear, pickupsByMonth, getTotalForMonth, isMonthCompleted, monthNames, quota, handleEdit, handleDelete, isLoading])

  return (
    <div className="space-y-6">
      {yearButtons}
      
      {selectedYear && (
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="py-3 px-4 text-left font-medium">Month</th>
                    <th className="py-3 px-4 text-left font-medium">Status</th>
                    <th className="py-3 px-4 text-left font-medium">Total Pickups</th>
                    <th className="py-3 px-4 text-left font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tableRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {!selectedYear && (
        <div className="text-center p-8 text-muted-foreground">
          No pickup history found
        </div>
      )}

      <Dialog open={!!editingPickup} onOpenChange={() => setEditingPickup(null)}>
        <DialogContent>
          <DialogHeader className='text-left'>
            <DialogTitle>Edit Pickup</DialogTitle>
            <DialogDescription>
              Edit the quantity and date of the pickup.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editQuantity">Quantity</Label>
                <Input
                  id="editQuantity"
                  type="text"
                  inputMode="numeric"
                  min={1}
                  value={editQuantity}
                  onChange={e => {
                    const val = e.target.value.replace(/^0+(?=\d)/, '')
                    if (val === '' || (/^\d+$/.test(val) && Number(val) >= 0)) {
                      setEditQuantity(val)
                    }
                  }}
                />

                <label className="text-sm font-medium">Pickup Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={editDate ? 'outline' : 'secondary'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !editDate && 'text-muted-foreground'
                      )}
                    >
                      {editDate ? (
                        format(editDate, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editDate ? new Date(editDate) : undefined}
                      onSelect={(day) => setEditDate(day ? format(day, 'yyyy-MM-dd') : '')}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingPickup(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingPickup} onOpenChange={() => setDeletingPickup(null)}>
        <DialogContent>
          <DialogHeader className='text-left'>
            <DialogTitle>Delete Pickup</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this pickup?</p>
            {deletingPickup && (
              <p className="text-sm text-muted-foreground mt-2">
                {deletingPickup.pickup_date}: {deletingPickup.quantity} sack{deletingPickup.quantity > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingPickup(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
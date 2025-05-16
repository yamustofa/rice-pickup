'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Profile } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Package, AlertCircle, CheckCircle2, CalendarIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface AddPickupDialogProps {
  user: Profile
  monthId: string
  isOpen: boolean
  onClose: () => void
  pickup?: {
    id: string
    quantity: number
    pickup_date: string
  } | null
}

export default function AddPickupDialog({ 
  user, 
  monthId, 
  isOpen, 
  onClose,
  pickup = null
}: AddPickupDialogProps) {
  const [quantity, setQuantity] = useState<string>(pickup ? String(pickup.quantity) : '1')
  const [currentPickedUp, setCurrentPickedUp] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pickupDate, setPickupDate] = useState<Date | undefined>(pickup ? new Date(pickup.pickup_date) : new Date())
  
  const supabase = createClient()
  
  useEffect(() => {
    if (isOpen && user) {
      // Get current pickup total for this month and user
      const fetchCurrentPickup = async () => {
        const { data } = await supabase
          .from('user_monthly_pickups')
          .select('total_quantity')
          .eq('user_id', user.id)
          .eq('month_id', monthId)
          .single()
          
        if (data) {
          setCurrentPickedUp(data.total_quantity || 0)
        } else {
          setCurrentPickedUp(0)
        }
      }
      
      fetchCurrentPickup()
    }
    
    // Reset form when dialog opens/closes or pickup changes
    if (pickup) {
      setQuantity(String(pickup.quantity))
      setPickupDate(new Date(pickup.pickup_date))
    } else {
      setQuantity('1')
      setPickupDate(new Date())
    }
  }, [isOpen, user, monthId, supabase, pickup])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    const qty = Number(quantity)
    try {
      if (currentPickedUp + qty > user.quota) {
        throw new Error(`This would exceed the monthly quota of ${user.quota} sacks`)
      }
      if (!pickupDate) {
        throw new Error('Please select a pickup date')
      }
      if (pickup) {
        // Edit mode: update the pickup
        const { error: updateError } = await supabase
          .from('pickups')
          .update({
            quantity: qty,
            pickup_date: format(pickupDate, 'yyyy-MM-dd'),
          })
          .eq('id', pickup.id)
        if (updateError) throw updateError
      } else {
        // Add mode: insert new pickup
        const { error: insertError } = await supabase
          .from('pickups')
          .insert({
            user_id: user.id,
            month_id: monthId,
            quantity: qty,
            pickup_date: format(pickupDate, 'yyyy-MM-dd'),
          })
        if (insertError) throw insertError
      }
      setSuccess(true)
      setIsLoading(false)
      toast.success('Pickup recorded successfully!')
      setTimeout(() => {
        onClose()
        window.location.reload()
      }, 1500)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while recording the pickup'
      setError(errorMessage)
      setIsLoading(false)
      toast.error('Failed to record pickup')
    }
  }
  
  const progressValue = user.quota > 0 ? (currentPickedUp / user.quota) * 100 : 0
  const remainingQuota = user.quota - currentPickedUp
  
  const handleDateSelect = (date: Date | null) => {
    setPickupDate(date || undefined);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Record Rice Pickup
          </DialogTitle>
          <DialogDescription>
            Add rice pickup for <span className="font-medium">{user.name}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="text-muted-foreground">Monthly Quota:</div>
              <div className="font-medium">{user.quota} sacks</div>
              
              <div className="text-muted-foreground">Already Picked Up:</div>
              <div className="font-medium">{currentPickedUp} sacks</div>
              
              <div className="text-muted-foreground">Available:</div>
              <div className="font-medium">{remainingQuota} sacks</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pickup Progress</span>
                <span className="font-medium">{progressValue.toFixed(0)}%</span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="text"
                inputMode="numeric"
                min={1}
                value={quantity}
                onChange={e => {
                  const val = e.target.value.replace(/^0+(?=\d)/, '') // remove leading zeros
                  if (val === '' || (/^\d+$/.test(val) && Number(val) >= 0)) {
                    setQuantity(val)
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Pickup Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={pickupDate ? 'outline' : 'secondary'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !pickupDate && 'text-muted-foreground'
                    )}
                  >
                    {pickupDate ? (
                      format(pickupDate, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={pickupDate}
                    onSelect={handleDateSelect}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <span className="text-destructive">{error}</span>
              </div>
            )}
            
            {success && (
              <div className="rounded-md bg-green-50 p-3 text-sm flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span className="text-green-600">Pickup recorded successfully!</span>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !pickupDate || !quantity}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {pickup ? 'Saving...' : 'Adding...'}
                  </>
                ) : (
                  pickup ? 'Save Changes' : 'Add Pickup'
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
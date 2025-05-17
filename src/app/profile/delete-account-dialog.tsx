'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function DeleteAccountDialog() {
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleDeleteAccount = async () => {
    if (confirmation !== 'yes, delete my account') {
      toast.error('Please type the confirmation text exactly as shown')
      return
    }

    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // Chain the deletion promises
      await supabase
        .from('pickups')
        .delete()
        .eq('user_id', user.id)
        .then(() => 
          supabase
            .from('divisions')
            .delete()
            .eq('created_by', user.id)
        )
        .then(() => 
          supabase
            .from('profiles')
            .delete()
            .eq('id', user.id)
        )
        .then(() => 
          supabase.auth.signOut()
        )
        .then(() => {
          toast.success('Account and all associated data deleted successfully')
          router.push('/login')
        })

    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className='text-left'>
          <DialogTitle>Delete Account</DialogTitle>
          <div className="text-sm text-muted-foreground">
            <p>This action cannot be undone. This will permanently delete your account
            and remove all your data from our servers, including:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Your profile information</li>
              <li>All your pickup records</li>
              <li>Any divisions you created</li>
            </ul>
          </div>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="confirmation">
            To confirm, type &quot;yes, delete my account&quot;
          </Label>
          <Input
            id="confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="yes, delete my account"
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={isLoading || confirmation !== 'yes, delete my account'}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Account'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
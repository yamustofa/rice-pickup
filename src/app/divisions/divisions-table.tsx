'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase/client'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Division {
  id: string
  name: string
  created_by: string | null
  created_at: string
  canManage: boolean
}

interface DivisionsTableProps {
  divisions: Division[]
  userId: string
}

export default function DivisionsTable({ divisions, userId }: DivisionsTableProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newDivisionName, setNewDivisionName] = useState('')
  const [editName, setEditName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingDivision, setDeletingDivision] = useState<Division | null>(null)
  
  const handleAddNew = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDivisionName.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { error: insertError } = await supabase
        .from('divisions')
        .insert({
          name: newDivisionName.trim(),
          created_by: userId
        })
      
      if (insertError) throw insertError
      
      setNewDivisionName('')
      setIsAddingNew(false)
      router.refresh()
      toast.success('Division added successfully')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add division'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [newDivisionName, userId, router, supabase])
  
  const handleStartEdit = useCallback((division: Division) => {
    setEditingId(division.id)
    setEditName(division.name)
  }, [])
  
  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditName('')
  }, [])
  
  const handleSaveEdit = useCallback(async (id: string) => {
    if (!editName.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { error: updateError } = await supabase
        .from('divisions')
        .update({ name: editName.trim() })
        .eq('id', id)
      
      if (updateError) throw updateError
      
      setEditingId(null)
      router.refresh()
      toast.success('Division updated successfully')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update division'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [editName, router, supabase])
  
  const handleDelete = useCallback((division: Division) => {
    setDeletingDivision(division)
  }, [])
  
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingDivision) return
    
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('divisions')
        .delete()
        .eq('id', deletingDivision.id)
      
      if (error) throw error
      
      toast.success('Division deleted successfully')
      router.refresh()
    } catch (error) {
      console.error('Error deleting division:', error)
      toast.error('Failed to delete division')
    } finally {
      setIsLoading(false)
      setDeletingDivision(null)
    }
  }, [deletingDivision, router, supabase])

  const handleDialogOpenChange = useCallback((open: boolean) => {
    if (!open) setDeletingDivision(null)
  }, [])
  
  // Memoize the table rows to prevent unnecessary re-renders
  const tableRows = useMemo(() => divisions.map(division => (
    <tr key={division.id} className="hover:bg-muted/30">
      <td className="py-3 px-4">
        {editingId === division.id ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="max-w-xs"
            autoFocus
          />
        ) : (
          <span>{division.name}</span>
        )}
      </td>
      <td className="py-3 px-4">
        {division.created_at ? format(new Date(division.created_at), 'MMM d, yyyy') : '—'}
      </td>
      <td className="py-3 px-4">
        {division.canManage && (
          <div className="flex gap-2">
            {editingId === division.id ? (
              <>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleSaveEdit(division.id)}
                  disabled={isLoading || !editName.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleStartEdit(division)}
                  disabled={isLoading}
                >
                  Edit
                </Button>
                <Button 
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(division)}
                  disabled={isLoading}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        )}
      </td>
    </tr>
  )), [divisions, editingId, editName, isLoading, handleCancelEdit, handleSaveEdit, handleStartEdit, handleDelete])
  
  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium">Divisions</h2>
          <Button 
            onClick={() => setIsAddingNew(true)} 
            disabled={isAddingNew || isLoading}
          >
            Add New Division
          </Button>
        </div>
        
        {isAddingNew && (
          <div className="bg-muted/30 border rounded-md p-4 space-y-4">
            <h3 className="font-medium">Add New Division</h3>
            <form onSubmit={handleAddNew} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newDivision">Division Name</Label>
                <Input
                  id="newDivision"
                  value={newDivisionName}
                  onChange={(e) => setNewDivisionName(e.target.value)}
                  placeholder="Enter division name"
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddingNew(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading || !newDivisionName.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Add Division'
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="py-3 px-4 text-left font-medium">Division Name</th>
                <th className="py-3 px-4 text-left font-medium">Created On</th>
                <th className="py-3 px-4 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tableRows}
              {divisions.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-muted-foreground">
                    No divisions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <Dialog open={!!deletingDivision} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Division</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the division and unassign all users from it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this division?</p>
            {deletingDivision && (
              <p className="font-semibold mt-4">{deletingDivision.name}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingDivision(null)}
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
    </>
  )
} 
'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Simplified division type that only requires id and name
interface SimpleDivision {
  id: string
  name: string
}

interface OnboardingFormProps {
  divisions: SimpleDivision[]
  userId: string
}

export default function OnboardingForm({ divisions, userId }: OnboardingFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [name, setName] = useState('')
  const [divisionId, setDivisionId] = useState('')
  const [newDivision, setNewDivision] = useState('')
  const [quota, setQuota] = useState<string>('')
  const [addingNewDivision, setAddingNewDivision] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Memoize the sorted divisions list
  const sortedDivisions = useMemo(() => 
    [...divisions].sort((a, b) => a.name.localeCompare(b.name)),
    [divisions]
  )
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate inputs
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    
    if (!addingNewDivision && !divisionId) {
      setError('Please select a division')
      return
    }
    
    if (addingNewDivision && !newDivision.trim()) {
      setError('Please enter a division name')
      return
    }
    
    const quotaNum = Number(quota)
    if (isNaN(quotaNum) || quotaNum < 1 || quotaNum > 3) {
      setError('Please enter a valid quota between 1 and 3')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      let selectedDivisionId = divisionId
      
      // If adding a new division, create it first
      if (addingNewDivision && newDivision) {
        const { data: newDivisionData, error: divisionError } = await supabase
          .from('divisions')
          .insert({ 
            name: newDivision.trim(), 
            created_by: userId 
          })
          .select('id')
          .single()
        
        if (divisionError) throw divisionError
        
        selectedDivisionId = newDivisionData.id
      }
      
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      let profileError
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            name: name.trim(),
            division_id: selectedDivisionId,
            quota: quotaNum,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
        profileError = error
      } else {
        // Insert new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            name: name.trim(),
            division_id: selectedDivisionId,
            quota: quotaNum,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        profileError = error
      }
      
      if (profileError) throw profileError
      
      toast.success('Profile updated successfully')
      
      // Refresh the page cache and redirect to homepage
      router.refresh()
      router.push('/')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating your profile'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [name, divisionId, newDivision, quota, addingNewDivision, userId, router, supabase])

  const handleQuotaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/^0+(?=\d)/, '') // remove leading zeros
    if (val === '' || (/^\d+$/.test(val) && Number(val) >= 0 && Number(val) <= 3)) {
      setQuota(val)
    }
  }, [])

  const toggleDivisionMode = useCallback(() => {
    setAddingNewDivision(prev => !prev)
    setDivisionId('')
    setNewDivision('')
  }, [])
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base">Name</Label>
          <Input
            id="name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-11 text-base"
            disabled={isLoading}
            autoFocus
          />
        </div>
        
        {!addingNewDivision ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="division" className="text-base">Division</Label>
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                onClick={toggleDivisionMode}
                disabled={isLoading}
              >
                Add new division
              </button>
            </div>
            <select
              id="division"
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={divisionId}
              onChange={(e) => setDivisionId(e.target.value)}
              required={!addingNewDivision}
              disabled={isLoading}
            >
              <option value="">Select a division</option>
              {sortedDivisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="newDivision" className="text-base">New Division</Label>
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                onClick={toggleDivisionMode}
                disabled={isLoading}
              >
                Select existing division
              </button>
            </div>
            <Input
              id="newDivision"
              placeholder="New division name"
              value={newDivision}
              onChange={(e) => setNewDivision(e.target.value)}
              required={addingNewDivision}
              className="h-11 text-base"
              disabled={isLoading}
            />
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="quota" className="text-base">Monthly Rice Quota (sacks)</Label>
          <Input
            id="quota"
            type="text"
            inputMode="numeric"
            min={1}
            max={3}
            value={quota}
            onChange={handleQuotaChange}
            required
            className="h-11 text-base"
            disabled={isLoading}
          />
          <p className="text-sm text-muted-foreground">
            You can pick up between 1-3 sacks per month
          </p>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full h-11 text-base font-medium" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Profile'
        )}
      </Button>
    </form>
  )
} 
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      let selectedDivisionId = divisionId
      
      // If adding a new division, create it first
      if (addingNewDivision && newDivision) {
        const { data: newDivisionData, error: divisionError } = await supabase
          .from('divisions')
          .insert({ name: newDivision, created_by: userId })
          .select('id')
          .single()
        
        if (divisionError) throw divisionError
        
        selectedDivisionId = newDivisionData.id
      }
      
      // If not adding a new division and no division selected
      if (!addingNewDivision && !selectedDivisionId) {
        throw new Error('Please select a division')
      }
      
      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name,
          division_id: selectedDivisionId,
          quota: Number(quota),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
      
      if (profileError) throw profileError
      
      // Refresh the page cache and redirect to homepage
      router.refresh()
      router.push('/')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating your profile'
      setError(errorMessage)
      setIsLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
        {!addingNewDivision ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="division">Division</Label>
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => setAddingNewDivision(true)}
              >
                Add new division
              </button>
            </div>
            <select
              id="division"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={divisionId}
              onChange={(e) => setDivisionId(e.target.value)}
              required={!addingNewDivision}
            >
              <option value="">Select a division</option>
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="newDivision">New Division</Label>
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => setAddingNewDivision(false)}
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
            />
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="quota">Monthly Rice Quota (sacks)</Label>
          <Input
            id="quota"
            type="text"
            inputMode="numeric"
            min={1}
            max={3}
            value={quota}
            onChange={e => {
              const val = e.target.value.replace(/^0+(?=\d)/, '') // remove leading zeros
              if (val === '' || (/^\d+$/.test(val) && Number(val) >= 0)) {
                setQuota(val)
              }
            }}
            required
          />
          <p className="text-xs text-muted-foreground">
            You can pick up between 1-3 sacks per month
          </p>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  )
} 
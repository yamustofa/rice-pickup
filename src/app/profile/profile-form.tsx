'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import Avatar, { genConfig } from 'react-nice-avatar'

// Simplified division type that only requires id and name
interface SimpleDivision {
  id: string
  name: string
}

interface ProfileWithDivision {
  id: string
  name: string | null
  quota: number
  division_id: string | null
  divisions: SimpleDivision | null
  created_at?: string
  updated_at?: string
  avatar_config?: AvatarConfig
}

interface ProfileFormProps {
  profile: ProfileWithDivision
  divisions: SimpleDivision[]
}

type AvatarConfig = {
  sex: 'man' | 'woman';
  [key: string]: unknown;
};

export default function ProfileForm({ profile, divisions }: ProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [name, setName] = useState(profile.name || '')
  const [divisionId, setDivisionId] = useState(profile.division_id || '')
  const [quota, setQuota] = useState(profile.quota)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | undefined>(undefined)
  const [staticMale, setStaticMale] = useState<AvatarConfig | undefined>(undefined)
  const [staticFemale, setStaticFemale] = useState<AvatarConfig | undefined>(undefined)

  useEffect(() => {
    // Only run on client
    const male = genConfig({ sex: 'man' })
    const female = genConfig({ sex: 'woman' })
    setStaticMale(male)
    setStaticFemale(female)
    // set default to male on initial load
    setAvatarConfig(male)

  }, [profile.avatar_config])

  if (!avatarConfig || !staticMale || !staticFemale) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      // Get current month's total pickups
      const { data: currentMonth } = await supabase
        .from('user_monthly_pickups')
        .select('total_quantity')
        .eq('user_id', profile.id)
        .single()

      if (currentMonth && quota < currentMonth.total_quantity) {
        throw new Error(`Cannot set quota below current month's total pickups (${currentMonth.total_quantity} sacks)`)
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name,
          division_id: divisionId,
          quota,
          updated_at: new Date().toISOString(),
          avatar_config: JSON.stringify(avatarConfig),
        })
        .eq('id', profile.id)
      
      if (updateError) throw updateError
      
      setSuccess(true)
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating your profile'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border shadow-sm">
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
        
        <div className="space-y-2">
          <Label htmlFor="division">Division</Label>
          <select
            id="division"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={divisionId}
            onChange={(e) => setDivisionId(e.target.value)}
            required
          >
            <option value="">Select a division</option>
            {divisions.map((division) => (
              <option key={division.id} value={division.id}>
                {division.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="quota">Monthly Rice Quota (sacks)</Label>
          <Input
            id="quota"
            type="number"
            min={1}
            max={3}
            value={quota || ''}
            onChange={(e) => {
              const value = e.target.value === '' ? '' : Number(e.target.value)
              setQuota(value === '' ? 0 : value)
            }}
            required
          />
          <p className="text-xs text-muted-foreground">
            You can pick up between 1-3 sacks per month
          </p>
        </div>

        {/* Avatar selection */}
        <div className="mb-4">
          <Label className="block font-medium mb-2">Choose Avatar</Label>
          <div className="flex gap-6 items-end">
            <button
              type="button"
              className={`border rounded-lg p-2 transition-colors hover:bg-accent/50 ${
                avatarConfig.sex === 'man' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setAvatarConfig(staticMale)}
            >
              <Avatar style={{ width: 64, height: 64 }} {...staticMale} />
              <div className="text-xs text-center mt-1">Male</div>
            </button>
            <button
              type="button"
              className={`border rounded-lg p-2 transition-colors hover:bg-accent/50 ${
                avatarConfig.sex === 'woman' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setAvatarConfig(staticFemale)}
            >
              <Avatar style={{ width: 64, height: 64 }} {...staticFemale} />
              <div className="text-xs text-center mt-1">Female</div>
            </button>
            {/* Show current selection */}
            <div className="ml-6">
              <div className="text-xs text-muted-foreground mb-1">Preview</div>
              <Avatar style={{ width: 64, height: 64 }} {...avatarConfig} />
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded">
          Profile updated successfully!
        </div>
      )}
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  )
} 
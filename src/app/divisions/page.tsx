import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '../components/header'
import DivisionsTable from './divisions-table'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export default async function DivisionsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Get current user profile and divisions in parallel
  const [profileResult, divisionsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name, division_id, quota, avatar_config, created_at, updated_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('divisions')
      .select(`
        id,
        name,
        created_by,
        created_at
      `)
      .order('name')
  ])

  if (profileResult.error) {
    console.error('Error fetching profile:', profileResult.error)
    redirect('/onboarding')
  }

  if (!profileResult.data) {
    redirect('/onboarding')
  }

  if (divisionsResult.error) {
    console.error('Error fetching divisions:', divisionsResult.error)
    throw new Error('Failed to fetch divisions')
  }

  // Map divisions with additional info
  const divisionsWithInfo = divisionsResult.data.map(division => ({
    id: division.id,
    name: division.name,
    created_by: division.created_by,
    created_at: division.created_at,
    canManage: division.created_by === user.id
  }))

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={profileResult.data} />
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Manage Divisions</h1>
          <p className="mb-6 text-muted-foreground">
            View all divisions and manage the ones you created.
          </p>
          
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }>
            <DivisionsTable 
              divisions={divisionsWithInfo} 
              userId={user.id}
            />
          </Suspense>
        </div>
      </main>
    </div>
  )
} 
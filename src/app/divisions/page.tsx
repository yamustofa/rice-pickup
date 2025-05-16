import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '../components/header'
import DivisionsTable from './divisions-table'

export default async function DivisionsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get current user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, division_id, quota, avatar_config, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Get all divisions
  const { data: divisions } = await supabase
    .from('divisions')
    .select(`
      id,
      name,
      created_by,
      created_at
    `)
    .order('name')

  // Map divisions with additional info
  const divisionsWithInfo = divisions?.map(division => ({
    id: division.id,
    name: division.name,
    created_by: division.created_by,
    created_at: new Date(division.created_at).toLocaleDateString(),
    canManage: division.created_by === user.id
  })) || []

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={profile} />
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Manage Divisions</h1>
          <p className="mb-6 text-muted-foreground">
            View all divisions and manage the ones you created.
          </p>
          
          <DivisionsTable 
            divisions={divisionsWithInfo} 
            userId={user.id}
          />
        </div>
      </main>
    </div>
  )
} 
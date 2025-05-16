import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from './components/header'
import Dashboard from './components/dashboard'

export default async function Home() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get current user profile
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('id, name, division_id, quota, avatar_config, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (!currentUserProfile || !currentUserProfile.name || !currentUserProfile.division_id) {
    redirect('/onboarding')
  }

  // Get current month info
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  
  // Get or create current month
  const { data: monthData } = await supabase
    .rpc('create_month_if_not_exists', {
      year_val: currentYear,
      month_val: currentMonth
    })
  
  // Get all users with their profiles and divisions
  const { data: users } = await supabase
    .from('profiles')
    .select(`
      id, 
      name, 
      quota,
      avatar_config,
      divisions(id, name)
    `)
    .order('name')
  
  // Get all pickup statuses for current month
  const { data: pickupStatuses } = await supabase
    .from('user_monthly_pickups')
    .select('user_id, total_quantity, is_completed')
    .eq('year', currentYear)
    .eq('month', currentMonth)
  
  // Create a map of user IDs to their pickup status
  const pickupStatusMap = new Map()
  pickupStatuses?.forEach(status => {
    pickupStatusMap.set(status.user_id, {
      total_quantity: status.total_quantity,
      is_completed: status.is_completed
    })
  })
  
  // Combine the data
  const usersWithStatus = users?.map(user => {
    const status = pickupStatusMap.get(user.id)
    return {
      id: user.id,
      name: user.name,
      division: user.divisions?.name || 'Unknown',
      quota: user.quota,
      pickedUp: status?.total_quantity || 0,
      isCompleted: status?.is_completed || false,
      avatar_config: user.avatar_config
    }
  }) || []
  
  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header user={currentUserProfile} />
      <main className="flex-1 container mx-auto py-6 px-4 max-w-7xl">
        <Dashboard
          users={usersWithStatus}
          currentUser={currentUserProfile}
          monthId={monthData as string}
        />
      </main>
      <footer className="border-t bg-white py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Rice Pickup Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
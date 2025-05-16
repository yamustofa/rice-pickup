import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '../components/header'
import HistoryTable from './history-table'

export default async function HistoryPage() {
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

  // Get the pickup history
  interface PickupWithMonth {
    id: string;
    quantity: number;
    pickup_date: string;
    months: {
      id: string;
      year: number;
      month: number;
    };
  }

  const { data: pickupLogs } = await supabase
    .from('pickups')
    .select(`
      id,
      quantity,
      pickup_date,
      months(id, year, month)
    `)
    .eq('user_id', user.id)
    .order('pickup_date', { ascending: false }) as { data: PickupWithMonth[] | null }

  // Get unique years and months
  const years = new Set<number>()
  
  interface PickupLog {
    id: string;
    quantity: number;
    pickup_date: string;
    year: number;
    month: number;
  }
  
  const pickupsByMonth: Record<string, PickupLog[]> = {}
  
  pickupLogs?.forEach(log => {
    if (log.months) {
      const year = log.months.year
      const month = log.months.month
      
      years.add(year)
      
      const key = `${year}-${month}`
      if (!pickupsByMonth[key]) {
        pickupsByMonth[key] = []
      }
      
      pickupsByMonth[key].push({
        id: log.id,
        quantity: log.quantity,
        pickup_date: new Date(log.pickup_date).toLocaleDateString(),
        year,
        month
      })
    }
  })
  
  // Sort years in descending order
  const sortedYears = Array.from(years).sort((a, b) => b - a)

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={profile} />
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Your Pickup History</h1>
          <p className="mb-6 text-muted-foreground">
            View all your rice pickups by month and year.
          </p>
          
          <HistoryTable 
            years={sortedYears} 
            pickupsByMonth={pickupsByMonth} 
            quota={profile.quota}
            user={profile}
          />
        </div>
      </main>
    </div>
  )
} 
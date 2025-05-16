import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '../components/header'
import HistoryTable from './history-table'
import { Json } from '@/types/supabase'
import { PostgrestError } from '@supabase/supabase-js'

// --- Type Aliases ---
type Profile = {
  id: string
  name: string | null
  division_id: string | null
  quota: number
  avatar_config: Json
  created_at: string
  updated_at: string
}

type PickupMonth = {
  id: string
  year: number
  month: number
}

type PickupWithMonth = {
  id: string
  quantity: number
  pickup_date: string
  months: PickupMonth
}

type PickupLog = PickupWithMonth & {
  year: number
  month: number
}

// --- Data Fetching ---
async function getHistoryData() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, division_id, quota, avatar_config, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/onboarding')
  }

  const { data: pickupLogs, error: pickupError } = await supabase
    .from('pickups')
    .select(`
      id,
      quantity,
      pickup_date,
      months(id, year, month)
    `)
    .eq('user_id', user.id)
    .order('pickup_date', { ascending: false }) as {
      data: PickupWithMonth[] | null
      error: PostgrestError | null
    }

  if (pickupError) {
    console.error('Error fetching pickup history:', pickupError)
    throw new Error('Failed to fetch pickup history')
  }

  const years = new Set<number>()
  const pickupsByMonth: Record<string, PickupLog[]> = {}

  pickupLogs?.forEach((log) => {
    if (log.months) {
      const { year, month } = log.months
      years.add(year)
      const key = `${year}-${month}`

      if (!pickupsByMonth[key]) {
        pickupsByMonth[key] = []
      }

      pickupsByMonth[key].push({ ...log, year, month })
    }
  })

  const sortedYears = Array.from(years).sort((a, b) => b - a)

  return {
    profile,
    years: sortedYears,
    pickupsByMonth,
  }
}

// --- Error Component ---
function HistoryError({ error }: { error: Error }) {
  return (
    <div className="flex-1 container mx-auto py-6 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h2>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    </div>
  )
}

// --- Main Page ---
export default async function HistoryPage() {
  try {
    const { profile, years, pickupsByMonth } = await getHistoryData()

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
              years={years}
              pickupsByMonth={pickupsByMonth}
              quota={profile.quota}
              user={profile}
            />
          </div>
        </main>
      </div>
    )
  } catch (error) {
    const errorUser: Profile = {
      id: '',
      name: null,
      division_id: null,
      quota: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      avatar_config: {} as Json
    }

    return (
      <div className="flex flex-col min-h-screen">
        <Header user={errorUser} />
        <HistoryError error={error instanceof Error ? error : new Error('An unexpected error occurred')} />
      </div>
    )
  }
}

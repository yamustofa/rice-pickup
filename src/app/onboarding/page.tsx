import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import OnboardingForm from './onboarding-form'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Separate data fetching into a function for better organization
async function getOnboardingData() {
  const supabase = await createClient()

  // Get current user and profile data in parallel
  const [authResult, profileResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('profiles')
      .select('name, division_id')
      .single()
  ])

  const { data: { user }, error: authError } = authResult

  if (authError || !user) {
    redirect('/login')
  }

  // If profile exists and has required fields, redirect to home
  if (profileResult.data?.name && profileResult.data?.division_id) {
    redirect('/')
  }

  // Get divisions data
  const { data: divisions, error: divisionsError } = await supabase
    .from('divisions')
    .select('id, name')
    .order('name')

  if (divisionsError) {
    console.error('Error fetching divisions:', divisionsError)
    throw new Error('Failed to fetch divisions')
  }

  return {
    user,
    divisions: divisions || []
  }
}

// Loading component for better UX
function OnboardingLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-[450px] space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Loading...
          </h1>
        </div>
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}

// Error component for better error handling
function OnboardingError({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-[450px] space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-red-600">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            {error.message}
          </p>
        </div>
      </div>
    </div>
  )
}

export default async function OnboardingPage() {
  try {
    const { user, divisions } = await getOnboardingData()

    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-[450px] space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Complete Your Profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Please provide your information to continue
            </p>
          </div>
          <Suspense fallback={<OnboardingLoading />}>
            <OnboardingForm 
              divisions={divisions} 
              userId={user.id} 
            />
          </Suspense>
        </div>
      </div>
    )
  } catch (error) {
    return <OnboardingError error={error instanceof Error ? error : new Error('An unexpected error occurred')} />
  }
} 
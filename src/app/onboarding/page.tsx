import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import OnboardingForm from './onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if the user has already completed onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, division_id')
    .eq('id', user.id)
    .single()

  if (profile?.name && profile?.division_id) {
    redirect('/')
  }

  // Get all divisions for the dropdown
  const { data: divisions } = await supabase
    .from('divisions')
    .select('id, name')
    .order('name')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Complete Your Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Please provide your information to continue
          </p>
        </div>
        <OnboardingForm divisions={divisions || []} userId={user.id} />
      </div>
    </div>
  )
} 
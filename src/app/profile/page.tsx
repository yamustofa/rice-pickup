import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '../components/header'
import ProfileForm from './profile-form'

export default async function ProfilePage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get current user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id,
      name,
      quota,
      avatar_config,
      division_id,
      created_at,
      updated_at,
      divisions(id, name)
    `)
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Get all divisions for the dropdown
  const { data: divisions } = await supabase
    .from('divisions')
    .select('id, name')
    .order('name')

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={profile} />
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
          <p className="mb-6 text-muted-foreground">
            Edit your personal information and rice quota.
          </p>
          <ProfileForm 
            profile={{
              ...profile,
              avatar_config:
                typeof profile.avatar_config === 'object' && profile.avatar_config !== null && 'sex' in profile.avatar_config
                  ? profile.avatar_config
                  : typeof profile.avatar_config === 'string'
                    ? (() => { try { const obj = JSON.parse(profile.avatar_config); return obj && typeof obj === 'object' && 'sex' in obj ? obj : undefined } catch { return undefined } })()
                    : undefined
            }}
            divisions={divisions || []}
          />
        </div>
      </main>
    </div>
  )
} 
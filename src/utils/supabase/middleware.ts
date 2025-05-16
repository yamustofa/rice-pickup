import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'



export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request: {
            headers: request.headers
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { 
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request: {
                        headers: request.headers
                    }, })
                    cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
                },
            },
        }
    )

    try {
        const { data: { user }, } = await supabase.auth.getUser()

        if (
            !user &&
            !request.nextUrl.pathname.startsWith('/login') &&
            !request.nextUrl.pathname.startsWith('/auth/callback') &&
            !request.nextUrl.pathname.startsWith('/api/auth')
        ) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        if (
            user &&
            request.nextUrl.pathname !== '/onboarding' &&
            !request.nextUrl.pathname.startsWith('/api/auth')
        ) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('name, division_id')
                .eq('id', user.id)
                .single()

            if (!profile || !profile.name || !profile.division_id) {
                const url = request.nextUrl.clone()
                url.pathname = '/onboarding'
                return NextResponse.redirect(url)
            }
        }
    } catch (error) {
        console.error('Authentication error:', error)
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
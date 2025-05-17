import LoginForm from './login-form'
import Image from 'next/image'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function LoginPage() {
  return (
    <>
      {/* Background pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-[radial-gradient(var(--muted)_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl flex overflow-hidden rounded-xl shadow-2xl bg-card/80 backdrop-blur-sm border">
          {/* Left side - Image with quote overlay */}
          <div className="relative w-3/5 hidden md:block">
            <div className="absolute inset-0 bg-black/30 z-10 rounded-l-xl"></div>
            <Image 
              src="/ricefield.webp"
              alt="Rice fields"
              width={1978}
              height={1320}
              className="h-full w-full object-cover rounded-l-xl"
              priority
            />
            <div className="absolute bottom-8 left-8 right-8 z-20">
              <div className="backdrop-blur-md bg-white/20 p-5 rounded-lg shadow-xl">
                <p className="text-md font-normal italic leading-relaxed text-white/80">
                  The lifeblood of nations, the humble grain of rice carries within it the energy of the sun, the purity of water, and the quiet strength cultivated by generations. It is not merely sustenance, but a symbol of resilience and the enduring connection between humanity and the earth.
                </p>
              </div>
            </div>
          </div>
          
          {/* Right side - Login form */}
          <div className="w-full md:w-2/5 bg-card/80 p-10 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center space-y-3 mb-8">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-2">
                <span style={{ fontSize: 40 }}>🍙</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-center text-foreground">
                Welcome to Rice Pickup Tracking
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in to manage your rice pickups
              </p>
            </div>
            <div className="w-full">
              <LoginForm />
            </div>
            <div className="mt-6 pt-6">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 
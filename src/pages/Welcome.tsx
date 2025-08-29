import { InteractiveChatDemo } from '@/components/Chat'
import { FeaturesSection } from '@/components/FeaturesSection'
import { Footer } from '@/components/Footer'
import { HeroSection } from '@/components/Hero'
import { Navigation } from '@/components/Navigation'
import React from 'react'

const Welcome = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
          <Navigation />
          <main>
            <HeroSection />
            <FeaturesSection />
            <InteractiveChatDemo />
            {/* <TestimonialsSection />
            <CTASection /> */}
          </main>
          <Footer />
        </div>
  )
}

export default Welcome
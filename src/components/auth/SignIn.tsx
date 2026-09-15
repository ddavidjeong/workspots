'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Logo from '@/components/ui/Logo';
import FluidOrb from '@/components/ui/fluid-orb';

interface SignInProps {
  onSignIn: () => void;
}

export default function SignIn({ onSignIn }: SignInProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate auth delay
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
    onSignIn();
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setIsLoading(false);
    onSignIn();
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#fefae0' }}>
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ backgroundColor: '#283618' }}>
        {/* Floating orbs with integrated icons */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Coffee orb */}
          <motion.div
            className="absolute"
            style={{ top: '10%', left: '10%' }}
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="relative w-[120px] h-[120px]">
              <FluidOrb size={120} color="#bc6c25" />
              <motion.svg
                className="absolute inset-0 m-auto w-12 h-12"
                viewBox="0 0 24 24"
                fill="none"
                animate={{ scale: [1, 1.05, 1], opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <path d="M4 8h12v9a4 4 0 01-4 4H8a4 4 0 01-4-4V8z" fill="rgba(254,250,224,0.85)" />
                <path d="M16 9c2 0 3 1.5 3 3s-1 3-3 3" stroke="rgba(254,250,224,0.85)" strokeWidth="2" strokeLinecap="round" />
                <path d="M7 5v2M10 4v3M13 5v2" stroke="rgba(254,250,224,0.6)" strokeWidth="1.5" strokeLinecap="round" />
              </motion.svg>
            </div>
          </motion.div>

          {/* Laptop orb */}
          <motion.div
            className="absolute"
            style={{ top: '60%', left: '60%' }}
            animate={{ y: [0, 15, 0], x: [0, -15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            <div className="relative w-[180px] h-[180px]">
              <FluidOrb size={180} color="#669bbc" />
              <motion.svg
                className="absolute inset-0 m-auto w-20 h-20"
                viewBox="0 0 24 24"
                fill="none"
                animate={{ scale: [1, 1.03, 1], opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <rect x="3" y="4" width="18" height="12" rx="2" fill="rgba(254,250,224,0.85)" />
                <rect x="5" y="6" width="14" height="8" rx="1" fill="rgba(102,155,188,0.6)" />
                <path d="M2 18h20" stroke="rgba(254,250,224,0.85)" strokeWidth="2" strokeLinecap="round" />
                <path d="M8 18v1h8v-1" stroke="rgba(254,250,224,0.7)" strokeWidth="1.5" />
              </motion.svg>
            </div>
          </motion.div>

          {/* Book orb */}
          <motion.div
            className="absolute"
            style={{ top: '30%', right: '15%' }}
            animate={{ y: [0, 25, 0], x: [0, -10, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          >
            <div className="relative w-[100px] h-[100px]">
              <FluidOrb size={100} color="#606c38" />
              <motion.svg
                className="absolute inset-0 m-auto w-10 h-10"
                viewBox="0 0 24 24"
                fill="none"
                animate={{ scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <path d="M4 4v16c3-1 5-1 8 0V4c-3 1-5 1-8 0z" fill="rgba(254,250,224,0.85)" />
                <path d="M12 4v16c3-1 5-1 8 0V4c-3 1-5 1-8 0z" fill="rgba(254,250,224,0.7)" />
                <path d="M6 8h4M6 11h3M14 8h4M14 11h3" stroke="rgba(96,108,56,0.5)" strokeWidth="1" strokeLinecap="round" />
              </motion.svg>
            </div>
          </motion.div>

          {/* Location pin orb */}
          <motion.div
            className="absolute"
            style={{ bottom: '15%', left: '30%' }}
            animate={{ y: [0, -15, 0], x: [0, 20, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            <div className="relative w-[80px] h-[80px]">
              <FluidOrb size={80} color="#dda15e" />
              <motion.svg
                className="absolute inset-0 m-auto w-8 h-8"
                viewBox="0 0 24 24"
                fill="none"
                animate={{ scale: [1, 1.08, 1], y: [0, -2, 0], opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              >
                <path d="M12 2C8 2 5 5.5 5 9.5c0 5 7 12.5 7 12.5s7-7.5 7-12.5C19 5.5 16 2 12 2z" fill="rgba(254,250,224,0.85)" />
                <circle cx="12" cy="9" r="2.5" fill="rgba(221,161,94,0.7)" />
              </motion.svg>
            </div>
          </motion.div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Logo size={80} animate={false} />
          </motion.div>
          <motion.h1
            className="mt-8 text-5xl font-bold tracking-tight"
            style={{ color: '#fefae0' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            WorkHub
          </motion.h1>
          <motion.p
            className="mt-4 text-xl opacity-80 max-w-md"
            style={{ color: '#fefae0' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Find your perfect spot to work, study, or just vibe. Cozy cafes, quiet libraries, buzzing coworking spaces.
          </motion.p>

          {/* Feature highlights */}
          <motion.div
            className="mt-12 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { icon: '☕', text: 'Discover cozy cafes with great wifi' },
              { icon: '📚', text: 'Find quiet libraries nearby' },
              { icon: '💻', text: 'Book coworking spaces instantly' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 opacity-70" style={{ color: '#fefae0' }}>
                <span className="text-xl">{feature.icon}</span>
                <span className="text-sm">{feature.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right side - Sign in form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-12">
            <Logo size={64} />
            <h1 className="mt-4 text-3xl font-bold" style={{ color: '#283618' }}>WorkHub</h1>
          </div>

          <h2 className="text-2xl font-semibold" style={{ color: '#283618' }}>
            Welcome back
          </h2>
          <p className="mt-2 text-stone-500">
            Sign in to find your next favorite spot
          </p>

          {/* Google Sign In */}
          <motion.button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="mt-8 w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 border-stone-200 bg-white font-medium transition-all hover:border-stone-300 hover:shadow-md disabled:opacity-50"
            style={{ color: '#283618' }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </motion.button>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-sm text-stone-400">or</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-stone-600 mb-2">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-12 px-4 rounded-xl border-2 border-stone-200 bg-white text-stone-800 placeholder-stone-400 transition-all focus:border-stone-400 focus:outline-none focus:ring-0"
              required
            />

            <motion.button
              type="submit"
              disabled={isLoading || !email}
              className="mt-4 w-full h-12 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: '#283618' }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {isLoading ? (
                <motion.div
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mx-auto"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                'Continue with Email'
              )}
            </motion.button>
          </form>

          <p className="mt-8 text-center text-sm text-stone-400">
            By signing in, you agree to our{' '}
            <a href="#" className="underline hover:text-stone-600">Terms</a>
            {' '}and{' '}
            <a href="#" className="underline hover:text-stone-600">Privacy Policy</a>
          </p>

          {/* Demo mode button */}
          <motion.button
            onClick={onSignIn}
            className="mt-6 w-full text-center text-sm text-stone-400 hover:text-stone-600 transition-colors"
            whileHover={{ scale: 1.01 }}
          >
            Skip for now (Demo mode)
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

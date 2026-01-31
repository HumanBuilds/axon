import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <header className="navbar bg-transparent absolute top-0 w-full px-4 py-4 z-10">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center px-4">
          <div className="flex-1">
            <span className="text-2xl font-black tracking-tighter">AXON</span>
          </div>
          <div className="flex-none flex items-center gap-4">
            <Link href="/login" className="btn btn-ghost">Login</Link>
            <Link href="/signup" className="btn btn-primary px-8">Sign Up</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-20">
        <div className="max-w-3xl">
          <div className="badge badge-secondary badge-outline mb-4 py-3 px-4 font-mono text-xs uppercase tracking-widest">
            FSRS v5 Enabled
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent leading-none py-1">
            Master your mind.
          </h1>
          <p className="text-xl md:text-2xl opacity-70 mb-10 leading-relaxed max-w-2xl mx-auto">
            Axon uses advanced spaced repetition algorithms to ensure you never forget what you've learned. Efficient, effective, and beautiful.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/decks" className="btn btn-primary btn-lg px-12 text-lg">
              Get Started
            </Link>
            <a href="#features" className="btn btn-outline btn-lg px-12 text-lg">
              Learn More
            </a>
          </div>
        </div>

        <div className="mt-20 w-full max-w-5xl">
          <div className="aspect-video bg-base-300 rounded-lg shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="card w-80 h-48 bg-base-100 shadow-xl border-2 border-primary/20 rotate-[-5deg] group-hover:rotate-0 transition-transform duration-500">
                <div className="card-body items-center justify-center italic opacity-50">
                  Flashcard Preview
                </div>
              </div>
              <div className="card w-80 h-48 bg-base-100 shadow-2xl border-2 border-primary absolute translate-x-12 translate-y-8 rotate-[5deg] group-hover:rotate-0 transition-transform duration-500">
                <div className="card-body items-center justify-center font-bold text-xl">
                  Ready to learn?
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section id="features" className="py-20 bg-base-200">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                <h3 className="card-title text-primary">Advanced FSRS</h3>
                <p className="opacity-70">Optimized scheduling based on your unique memory patterns. Higher retention in less time.</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                <h3 className="card-title text-secondary">3D Visuals</h3>
                <p className="opacity-70">Smooth, interactive card flipping and polished UI that makes studying feel like a game.</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body">
                <h3 className="card-title text-accent">Cross-Platform</h3>
                <p className="opacity-70">Your brain is everywhere, and so is Axon. Sync your progress across all your devices.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer footer-center p-10 bg-base-300 text-base-content rounded">
        <aside>
          <p className="font-bold">AXON Flashcards</p>
          <p>The neuro-optimized learning platform.</p>
        </aside>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-24">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-6xl font-bold tracking-tight text-gray-900">
          <span className="text-blue-600">Gym</span> Pilot
        </h1>
        <p className="max-w-2xl text-xl text-gray-600">
          Modern gym management platform for fitness businesses
        </p>
        <div className="flex gap-4 mt-8">
          <button className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition">
            Get Started
          </button>
          <button className="rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold hover:border-gray-400 transition">
            Learn More
          </button>
        </div>
      </main>
      <footer className="mt-16 text-sm text-gray-500">
        © 2026 Gym Pilot. All rights reserved.
      </footer>
    </div>
  );
}

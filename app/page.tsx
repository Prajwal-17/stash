import { ArrowUp } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center py-4 mb-8">
        <h1 className="text-xl font-medium tracking-tight text-neutral-400">
          / tag name
        </h1>
        <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700"></div>
      </header>

      {/* Web */}
      <div className="hidden md:block mb-10">
        <div className="relative group">
          <input
            type="text"
            placeholder="input box"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-3 px-4 pr-12 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-700 transition-all"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-neutral-800 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors">
            <ArrowUp size={16} />
          </button>
        </div>
      </div>

      <div className="flex justify-between text-sm text-neutral-500 mb-4 px-2">
        <span>title</span>
        <span>created on</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-24 md:pb-0">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="w-full h-12 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 transition-colors"
          ></div>
        ))}
      </div>

      {/* Mobile */}
      <div className="md:hidden fixed bottom-6 left-4 right-4">
        <div className="relative shadow-xl shadow-black/50">
          <input
            type="text"
            placeholder="input box"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-4 px-5 pr-14 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-700 transition-all"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-neutral-800 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors">
            <ArrowUp size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

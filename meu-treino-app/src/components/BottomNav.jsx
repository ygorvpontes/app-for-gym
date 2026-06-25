export function BottomNav({ currentTab, setCurrentTab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-[#2c2c2e] bg-[#121212] pb-safe pt-2 px-6 flex justify-around z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <button onClick={() => setCurrentTab('dashboard')} className={`flex flex-col items-center gap-1 p-2 ${currentTab === 'dashboard' ? 'text-emerald-500' : 'text-gray-500 hover:text-gray-400'}`}>
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
        </svg>
        <span className="text-[10px] font-bold">Início</span>
      </button>
      
      <button onClick={() => setCurrentTab('treino')} className={`flex flex-col items-center gap-1 p-2 ${currentTab === 'treino' ? 'text-emerald-500' : 'text-gray-500 hover:text-gray-400'}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
        </svg>
        <span className="text-[10px] font-bold">Treinar</span>
      </button>
    </nav>
  );
}
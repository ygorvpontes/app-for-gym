import { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { BottomNav } from './components/BottomNav';
import { Registration } from './components/Registration';
import { SetupTreinos } from './components/SetupTreinos';
import { Dashboard } from './components/Dashboard';
import { TreinoAtivo } from './components/TreinoAtivo';

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') console.log('MyWorkout instalado!');
    setDeferredPrompt(null);
  };

  const [userProfile, setUserProfile] = useLocalStorage('treino_user_profile', {
    name: '', age: '', weight: '', goal: 'Hipertrofia', experience: 'Iniciante', hasOnboarded: false, streak: 0, fichas: [], modalidades: [] 
  });
  const [workouts, setWorkouts] = useLocalStorage('treino_workouts_history', []);
  
  const [activeModalidadeIndex, setActiveModalidadeIndex] = useState(0);
  const [showModalidadeSelector, setShowModalidadeSelector] = useState(false);
  const [newModalidadeName, setNewModalidadeName] = useState('');
  const [currentTab, setCurrentTab] = useState('dashboard'); 

  const currentModalidades = userProfile.modalidades && userProfile.modalidades.length > 0 
    ? userProfile.modalidades 
    : [{ id: 'default', nome: '🏋️ Musculação', fichas: userProfile.fichas || [] }];

  const limparBanco = () => { localStorage.clear(); window.location.reload(); };

  const renderModalidadeSelector = () => {
    if (!showModalidadeSelector) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 animate-fade-in backdrop-blur-sm">
        <div className="w-full max-w-md bg-[#1c1c1e] rounded-t-3xl p-6 border-t border-gray-800 animate-slide-up pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">O que vamos treinar?</h2>
            <button onClick={() => setShowModalidadeSelector(false)} className="text-gray-500 text-3xl leading-none">&times;</button>
          </div>
          <div className="flex flex-col gap-3 mb-6 max-h-[40vh] overflow-y-auto scrollbar-hide">
            {currentModalidades.map((mod, idx) => (
              <button key={idx} onClick={() => { setActiveModalidadeIndex(idx); setShowModalidadeSelector(false); }} className={`flex items-center justify-between p-4 rounded-xl border ${activeModalidadeIndex === idx ? 'bg-emerald-900/20 border-emerald-500 text-emerald-400' : 'bg-[#2c2c2e] border-transparent text-gray-300'}`}>
                <span className="font-bold text-lg">{mod.nome}</span>
                {activeModalidadeIndex === idx && <span className="text-emerald-500">✅</span>}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-6">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">Nova Modalidade</p>
            <div className="flex gap-2">
              <input type="text" value={newModalidadeName} onChange={e => setNewModalidadeName(e.target.value)} placeholder="Ex: 🥋 Jiu-Jitsu" className="flex-1 bg-[#2c2c2e] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-white" />
              <button onClick={() => {
                 if(!newModalidadeName.trim()) return;
                 const mods = [...currentModalidades, { id: crypto.randomUUID(), nome: newModalidadeName, fichas: [] }];
                 setUserProfile({ ...userProfile, modalidades: mods });
                 setActiveModalidadeIndex(mods.length - 1);
                 setNewModalidadeName('');
                 setShowModalidadeSelector(false);
              }} className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl active:scale-95 transition-transform">+</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!userProfile.name) {
    return <Registration userProfile={userProfile} setUserProfile={setUserProfile} currentModalidades={currentModalidades} />
  }

  const temFichasValidas = currentModalidades[activeModalidadeIndex]?.fichas?.length > 0;

  if (!userProfile.hasOnboarded || !temFichasValidas) {
    return <SetupTreinos 
      userProfile={userProfile} 
      setUserProfile={setUserProfile} 
      currentModalidades={currentModalidades} 
      activeModalidadeIndex={activeModalidadeIndex} 
      setActiveModalidadeIndex={setActiveModalidadeIndex}
      modalidadeSelectorNode={renderModalidadeSelector()}
      onOpenModalidades={() => setShowModalidadeSelector(true)}
    />
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#121212] pb-24 relative animate-fade-in font-sans">
      {renderModalidadeSelector()}
      
      {currentTab === 'dashboard' && (
        <Dashboard 
          userName={userProfile.name}
          modalidadeName={currentModalidades[activeModalidadeIndex]?.nome}
          onOpenModalidades={() => setShowModalidadeSelector(true)}
          limparBanco={limparBanco}
          deferredPrompt={deferredPrompt}
          handleInstallClick={handleInstallClick}
          workouts={workouts}
          setCurrentTab={setCurrentTab}
        />
      )}

      {currentTab === 'treino' && (
        <TreinoAtivo 
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          workouts={workouts}
          setWorkouts={setWorkouts}
          currentModalidades={currentModalidades}
          activeModalidadeIndex={activeModalidadeIndex}
          setShowModalidadeSelector={setShowModalidadeSelector}
          setCurrentTab={setCurrentTab}
          limparBanco={limparBanco}
        />
      )}

      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </div>
  );
}

export default App;
import { useState } from 'react';

export function Registration({ userProfile, setUserProfile, currentModalidades }) {
  const [regData, setRegData] = useState({
    name: userProfile.name || '',
    age: userProfile.age || '',
    weight: userProfile.weight || '',
    goal: userProfile.goal || 'Hipertrofia',
    experience: userProfile.experience || 'Iniciante'
  });

  const handleSaveRegistration = () => {
    if (!regData.name.trim()) return alert("Por favor, preencha pelo menos o seu nome!");
    setUserProfile({ ...userProfile, ...regData, modalidades: currentModalidades });
  };

  return (
    <div className="flex min-h-screen flex-col p-6 animate-fade-in bg-[#121212] text-white">
      <h1 className="mt-8 mb-2 text-3xl font-bold text-emerald-500">Criar Perfil</h1>
      <p className="mb-8 text-sm text-gray-400">Preencha seus dados para personalizar seu app.</p>
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-bold text-gray-300">Como prefere ser chamado?</label>
          <input type="text" value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} placeholder="Seu nome ou apelido" className="w-full rounded-xl bg-[#1c1c1e] p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-800/50" />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-bold text-gray-300">Idade</label>
            <input type="number" value={regData.age} onChange={e => setRegData({...regData, age: e.target.value})} placeholder="Ex: 25" className="w-full rounded-xl bg-[#1c1c1e] p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-800/50" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-bold text-gray-300">Peso (kg)</label>
            <input type="number" value={regData.weight} onChange={e => setRegData({...regData, weight: e.target.value})} placeholder="Ex: 80" className="w-full rounded-xl bg-[#1c1c1e] p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-800/50" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-gray-300">Objetivo Principal</label>
          <select value={regData.goal} onChange={e => setRegData({...regData, goal: e.target.value})} className="w-full rounded-xl bg-[#1c1c1e] p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none border border-gray-800/50">
            <option value="Hipertrofia">Hipertrofia (Ganho de Massa)</option>
            <option value="Emagrecimento">Emagrecimento (Perda de Gordura)</option>
            <option value="Força">Ganho de Força</option>
            <option value="Manutenção">Manutenção de Saúde</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-gray-300">Tempo de Treino</label>
          <select value={regData.experience} onChange={e => setRegData({...regData, experience: e.target.value})} className="w-full rounded-xl bg-[#1c1c1e] p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none border border-gray-800/50">
            <option value="Iniciante">Iniciante (0 a 6 meses)</option>
            <option value="Intermediário">Intermediário (6 meses a 2 anos)</option>
            <option value="Avançado">Avançado (+ 2 anos)</option>
          </select>
        </div>
      </div>
      <button onClick={handleSaveRegistration} className="mt-8 w-full rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white shadow-lg active:bg-emerald-700">Avançar para Treinos →</button>
    </div>
  );
}
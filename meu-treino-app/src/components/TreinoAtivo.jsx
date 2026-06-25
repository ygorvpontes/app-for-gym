import { useState, useEffect } from 'react';

export function TreinoAtivo({
  userProfile,
  setUserProfile,
  workouts,
  setWorkouts,
  currentModalidades,
  activeModalidadeIndex,
  setShowModalidadeSelector,
  setCurrentTab,
  limparBanco
}) {
  const [activeFichaIndex, setActiveFichaIndex] = useState(0);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(0);
  const [sets, setSets] = useState(3);
  const [weight, setWeight] = useState(20);
  const [reps, setReps] = useState(10);
  const [lastRecord, setLastRecord] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNoteText, setCurrentNoteText] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [showTimerOptions, setShowTimerOptions] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    else if (timeLeft === 0) { setTimerActive(false); clearInterval(interval); }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const startTimer = (seconds) => { setTimeLeft(seconds); setTimerActive(true); setShowTimerOptions(false); };
  const formatTime = (seconds) => { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m}:${s < 10 ? '0' : ''}${s}`; };

  useEffect(() => { setSelectedExerciseIndex(0); }, [activeFichaIndex]);

  useEffect(() => {
    const fichasSalvas = currentModalidades[activeModalidadeIndex]?.fichas || [];
    if (userProfile.hasOnboarded && fichasSalvas.length > 0) {
      const fichaAtual = fichasSalvas[activeFichaIndex];
      const exercicioAtual = fichaAtual?.exercicios?.[selectedExerciseIndex];
      
      if (exercicioAtual) {
        setSets(exercicioAtual.defaultSets || 1);
        setReps(exercicioAtual.defaultReps || 10);
        let foundRecord = null;
        for (let i = workouts.length - 1; i >= 0; i--) {
          const dayWorkout = workouts[i];
          for (let j = dayWorkout.sets.length - 1; j >= 0; j--) {
            if (dayWorkout.sets[j].exercise === exercicioAtual.nome) { foundRecord = dayWorkout.sets[j]; break; }
          }
          if (foundRecord) break;
        }
        if (foundRecord) { setLastRecord(foundRecord); setWeight(foundRecord.weight); } 
        else { setLastRecord(null); setWeight(20); }
      }
    }
  }, [userProfile, activeModalidadeIndex, activeFichaIndex, selectedExerciseIndex, workouts]);

  const handleSaveSet = () => {
    const today = new Date().toISOString().split('T')[0];
    const exercicioAtual = currentModalidades[activeModalidadeIndex]?.fichas?.[activeFichaIndex]?.exercicios?.[selectedExerciseIndex];
    if (!exercicioAtual) return; 

    const newSet = { id: crypto.randomUUID(), exercise: exercicioAtual.nome, sets: Number(sets) || 1, weight: Number(weight) || 0, reps: Number(reps) || 1, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    const updatedWorkouts = [...workouts];
    let todayWorkout = updatedWorkouts.find(w => w.date === today);

    if (todayWorkout) todayWorkout.sets.push(newSet); 
    else updatedWorkouts.push({ date: today, sets: [newSet], completedFichas: [] }); 
    setWorkouts(updatedWorkouts);
  };

  const handleConcluirTreino = () => {
    const today = new Date().toISOString().split('T')[0];
    const fichaNome = currentModalidades[activeModalidadeIndex]?.fichas?.[activeFichaIndex]?.nome;
    const updatedWorkouts = [...workouts];
    let todayWorkout = updatedWorkouts.find(w => w.date === today);

    if (todayWorkout) {
      if (!todayWorkout.completedFichas) todayWorkout.completedFichas = [];
      if (!todayWorkout.completedFichas.includes(fichaNome)) todayWorkout.completedFichas.push(fichaNome);
    } else updatedWorkouts.push({ date: today, sets: [], completedFichas: [fichaNome] });

    setWorkouts(updatedWorkouts);
    if (window.navigator?.vibrate) window.navigator.vibrate(200);
    setCurrentTab('dashboard');
  };

  const handleOpenNoteModal = () => {
    const exercAtual = currentModalidades[activeModalidadeIndex]?.fichas?.[activeFichaIndex]?.exercicios?.[selectedExerciseIndex];
    if (!exercAtual) return;
    setCurrentNoteText(exercAtual.nota || '');
    setShowNoteModal(true);
  };

  const handleSaveNote = () => {
    const mods = [...currentModalidades];
    if (mods[activeModalidadeIndex]?.fichas?.[activeFichaIndex]?.exercicios?.[selectedExerciseIndex]) {
      mods[activeModalidadeIndex].fichas[activeFichaIndex].exercicios[selectedExerciseIndex].nota = currentNoteText;
      setUserProfile({ ...userProfile, modalidades: mods });
    }
    setShowNoteModal(false);
  };

  const today = new Date().toISOString().split('T')[0];
  const todayWorkout = workouts.find(w => w.date === today);
  const todaysSets = todayWorkout?.sets || [];
  const fichaAtual = currentModalidades[activeModalidadeIndex]?.fichas?.[activeFichaIndex];
  const exercicioAtual = fichaAtual?.exercicios?.[selectedExerciseIndex];
  const isTreinoConcluidoHoje = todayWorkout?.completedFichas?.includes(fichaAtual?.nome);

  return (
    <div className="animate-fade-in">
      <header className="flex items-center justify-between bg-[#121212] p-4 z-40 sticky top-0 shadow-sm border-b border-gray-800/50">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-xl font-bold text-emerald-500">Fala, {userProfile.name}!</h1>
          <button onClick={() => setShowModalidadeSelector(true)} className="flex items-center gap-1 bg-[#1c1c1e] px-2 py-1 rounded border border-gray-800 text-[10px] font-bold text-emerald-400 active:scale-95 transition-transform">
             {currentModalidades[activeModalidadeIndex]?.nome} ▾
          </button>
        </div>
        <button onClick={limparBanco} className="rounded-full bg-red-900/30 px-3 py-1 text-xs text-red-400">Sair</button>
      </header>

      <div className="px-4 mt-2">
        {showNoteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 animate-fade-in backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl bg-[#1c1c1e] p-6 shadow-2xl border border-gray-800">
              <h3 className="mb-2 text-lg font-bold text-emerald-500">Notas do Exercício</h3>
              <p className="mb-4 text-xs text-gray-400">{exercicioAtual?.nome}</p>
              <textarea value={currentNoteText} onChange={(e) => setCurrentNoteText(e.target.value)} placeholder="Ex: Focar na descida lenta..." className="mb-6 h-32 w-full rounded-xl bg-[#2c2c2e] p-4 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-emerald-500" />
              <div className="flex gap-3">
                <button onClick={() => setShowNoteModal(false)} className="flex-1 rounded-xl bg-[#2c2c2e] py-3 font-bold text-gray-400 active:bg-gray-700">Cancelar</button>
                <button onClick={handleSaveNote} className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white active:bg-emerald-700">Salvar Nota</button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 mt-2 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {currentModalidades[activeModalidadeIndex]?.fichas?.map((ficha, index) => (
            <button key={index} onClick={() => setActiveFichaIndex(index)} className={`whitespace-nowrap rounded-lg px-6 py-2 text-sm font-bold transition-colors ${activeFichaIndex === index ? 'bg-emerald-600 text-white' : 'bg-[#1c1c1e] text-gray-400 hover:bg-[#2c2c2e] border border-gray-800/50'}`}>
              {ficha.nome}
            </button>
          ))}
          <button onClick={() => { setUserProfile({...userProfile, hasOnboarded: false}); }} className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold bg-[#1c1c1e] text-emerald-500 hover:bg-[#2c2c2e] border border-gray-800/50">
            + Treino
          </button>
        </div>

        <section className="mb-8 rounded-2xl bg-[#1c1c1e] p-4 shadow-lg border border-gray-800/50">
          <label className="mb-2 block text-sm font-semibold text-gray-400">Exercício</label>
          <div className="relative mb-6 z-10">
            <select value={selectedExerciseIndex} onChange={(e) => setSelectedExerciseIndex(Number(e.target.value))} className="w-full appearance-none rounded-xl bg-[#2c2c2e] p-4 pr-10 text-base text-gray-100 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer border border-gray-800/50">
              {fichaAtual?.exercicios?.map((ex, idx) => (
                <option key={idx} value={idx}>{ex.nome}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-emerald-500">
              <svg className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>

          {lastRecord && (
            <div className="mb-6 -mt-3 text-center text-xs font-semibold text-emerald-400/80 flex items-center justify-center gap-2">
              <span>💡</span> Última marca: {lastRecord.weight} kg ({lastRecord.sets} séries x {lastRecord.reps} reps)
            </div>
          )}

          <div className="mb-6 flex gap-1 sm:gap-2">
            <div className="flex-1">
              <label className="mb-2 block text-center text-[10px] sm:text-xs font-semibold text-gray-400">Séries</label>
              <div className="flex items-center justify-between rounded-xl bg-[#2c2c2e] p-1 sm:p-2 border border-gray-800/50">
                <button onClick={() => setSets(s => Math.max(1, Number(s) - 1))} className="flex h-10 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-700/50 text-xl font-bold text-gray-300 transition-colors active:bg-gray-600">-</button>
                <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} onBlur={(e) => setSets(Number(e.target.value) || 1)} className="w-full bg-transparent text-center text-base font-bold text-gray-100 outline-none [appearance:textfield] sm:text-xl [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                <button onClick={() => setSets(s => Number(s) + 1)} className="flex h-10 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-700/50 text-xl font-bold text-gray-300 transition-colors active:bg-gray-600">+</button>
              </div>
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-center text-[10px] sm:text-xs font-semibold text-gray-400">Peso (kg)</label>
              <div className="flex items-center justify-between rounded-xl bg-[#2c2c2e] p-1 sm:p-2 border border-gray-800/50">
                <button onClick={() => setWeight(w => Math.max(0, Number(w) - 1))} className="flex h-10 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-700/50 text-xl font-bold text-gray-300 transition-colors active:bg-gray-600">-</button>
                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} onBlur={(e) => setWeight(Number(e.target.value) || 0)} className="w-full bg-transparent text-center text-base font-bold text-gray-100 outline-none [appearance:textfield] sm:text-xl [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                <button onClick={() => setWeight(w => Number(w) + 1)} className="flex h-10 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-700/50 text-xl font-bold text-gray-300 transition-colors active:bg-gray-600">+</button>
              </div>
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-center text-[10px] sm:text-xs font-semibold text-gray-400">Reps</label>
              <div className="flex items-center justify-between rounded-xl bg-[#2c2c2e] p-1 sm:p-2 border border-gray-800/50">
                <button onClick={() => setReps(r => Math.max(0, Number(r) - 1))} className="flex h-10 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-700/50 text-xl font-bold text-gray-300 transition-colors active:bg-gray-600">-</button>
                <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} onBlur={(e) => setReps(Number(e.target.value) || 0)} className="w-full bg-transparent text-center text-base font-bold text-gray-100 outline-none [appearance:textfield] sm:text-xl [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                <button onClick={() => setReps(r => Number(r) + 1)} className="flex h-10 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-700/50 text-xl font-bold text-gray-300 transition-colors active:bg-gray-600">+</button>
              </div>
            </div>
          </div>

          <button onClick={handleSaveSet} className="w-full rounded-xl bg-[#2c2c2e] py-4 text-lg font-bold text-emerald-500 border border-emerald-900/30 active:bg-gray-700">+ Salvar Registo</button>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-sm font-bold text-gray-100">Registos de Hoje</h2>
          {todaysSets.length === 0 ? (
            <p className="text-center text-xs text-gray-500">Nenhum registo hoje.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {todaysSets.map((set, index) => (
                <div key={set.id} className="flex items-center justify-between rounded-lg bg-[#1c1c1e] p-4 border border-gray-800">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-100">{set.exercise}</span>
                    <span className="text-[10px] text-gray-500">Reg. {index + 1} • {set.time}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-emerald-400">{set.weight} kg</span>
                    <span className="block text-[10px] text-gray-500">{set.sets} séries x {set.reps} reps</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mb-12">
          {isTreinoConcluidoHoje ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl bg-emerald-900/20 p-5 border border-emerald-800/30">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-bold text-emerald-400">Treino Concluído!</p>
              </div>
            </div>
          ) : (
            <button onClick={handleConcluirTreino} className="w-full rounded-2xl bg-emerald-600 py-4 text-lg font-bold text-white active:scale-95 transition-transform">
              ✅ Finalizar Treino
            </button>
          )}
        </div>
      </div>

      <div className="fixed bottom-20 right-4 flex flex-col items-end gap-3 z-50">
        <button onClick={handleOpenNoteModal} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2c2c2e] border border-gray-700 text-lg font-bold shadow-xl active:scale-95 transition-transform">
          {exercicioAtual?.nota ? '📝' : '➕'}
        </button>
        {showTimerOptions && (
          <div className="flex flex-col gap-2 rounded-xl bg-[#2c2c2e] p-3 shadow-lg border border-gray-700">
            <button onClick={() => startTimer(60)} className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-bold text-emerald-400">1:00 min</button>
            <button onClick={() => startTimer(90)} className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-bold text-emerald-400">1:30 min</button>
            <button onClick={() => startTimer(120)} className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-bold text-emerald-400">2:00 min</button>
          </div>
        )}
        <button onClick={() => { if (timerActive) setTimerActive(false); else setShowTimerOptions(!showTimerOptions); }} className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold shadow-xl active:scale-95 transition-transform ${timerActive ? 'bg-orange-600 text-white animate-pulse' : 'bg-emerald-600 text-white'}`}>
          {timerActive ? formatTime(timeLeft) : '⏱️'}
        </button>
      </div>
    </div>
  );
}
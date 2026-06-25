export function Dashboard({
  userName,
  modalidadeName,
  onOpenModalidades,
  limparBanco,
  deferredPrompt,
  handleInstallClick,
  workouts,
  setCurrentTab
}) {
  
  // --- Lógica Matemática exclusiva do Dashboard ---
  const getDiasDaSemanaAtual = () => {
    const hoje = new Date();
    const diaSemana = hoje.getDay(); 
    const diffParaSegunda = hoje.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1); 
    const segunda = new Date(hoje.setDate(diffParaSegunda));
    
    const dias = [];
    const nomes = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    for (let i = 0; i < 7; i++) {
      const data = new Date(segunda);
      data.setDate(segunda.getDate() + i);
      const iso = data.toISOString().split('T')[0];
      const workoutDoDia = workouts.find(w => w.date === iso);
      dias.push({ nome: nomes[i], dataIso: iso, isCompleted: workoutDoDia?.completedFichas?.length > 0, isToday: iso === new Date().toISOString().split('T')[0] });
    }
    return dias;
  };

  const formatarDataTimeline = (isoDate) => {
    const data = new Date(isoDate + 'T12:00:00'); 
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${diasSemana[data.getDay()]}, ${data.getDate() < 10 ? '0'+data.getDate() : data.getDate()} de ${meses[data.getMonth()]}`;
  };

  const getStats = () => {
    let totalWorkouts = workouts.length, totalVolume = 0, exerciseCounts = {};
    workouts.forEach(dia => {
      if(dia.sets) dia.sets.forEach(set => {
          totalVolume += (Number(set.sets) * Number(set.reps) * Number(set.weight));
          exerciseCounts[set.exercise] = (exerciseCounts[set.exercise] || 0) + 1;
        });
    });
    let volumeText = totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)} ton` : `${totalVolume} kg`;
    let favExercise = "Nenhum ainda", max = 0;
    for (const ex in exerciseCounts) { if (exerciseCounts[ex] > max) { max = exerciseCounts[ex]; favExercise = ex; } }
    return { totalWorkouts, volumeText, favExercise };
  };

  const getVolumeDaSemana = () => {
    const hoje = new Date();
    const diaSemana = hoje.getDay(); 
    const diffParaSegunda = hoje.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1); 
    const segunda = new Date(hoje.setDate(diffParaSegunda));
    const diasGrafico = [], nomes = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
    let maxVolume = 0;

    for (let i = 0; i < 7; i++) {
      const data = new Date(segunda);
      data.setDate(segunda.getDate() + i);
      const iso = data.toISOString().split('T')[0];
      const workoutDoDia = workouts.find(w => w.date === iso);
      let volumeDoDia = 0;
      if (workoutDoDia && workoutDoDia.sets) workoutDoDia.sets.forEach(set => { volumeDoDia += (Number(set.sets) * Number(set.reps) * Number(set.weight)); });
      if (volumeDoDia > maxVolume) maxVolume = volumeDoDia;
      diasGrafico.push({ nomeCurto: nomes[i], volume: volumeDoDia, isToday: iso === new Date().toISOString().split('T')[0] });
    }
    return { diasGrafico, maxVolume };
  };

  const diasSemana = getDiasDaSemanaAtual();
  const stats = getStats();
  const volumeSemana = getVolumeDaSemana();

  return (
    <div className="flex flex-col animate-fade-in pt-6 px-4">
      {/* CABEÇALHO */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-2xl font-bold text-white leading-none">Minha atividade</h1>
          <button onClick={onOpenModalidades} className="flex items-center gap-1 bg-[#1c1c1e] px-3 py-1.5 rounded-lg border border-gray-800 text-xs font-bold text-emerald-400 active:scale-95 transition-transform shadow-sm mt-1">
             {modalidadeName} ▾
          </button>
        </div>
        <button onClick={limparBanco} className="rounded-full bg-red-900/30 px-3 py-1.5 text-xs font-bold text-red-400 border border-red-900/50">Sair</button>
      </header>

      {/* BANNER DE INSTALAÇÃO (PWA) */}
      {deferredPrompt && (
        <div className="flex items-center justify-between rounded-2xl bg-emerald-900/30 border border-emerald-800/50 p-4 mb-6 animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-emerald-400">Instalar App</h3>
            <p className="text-xs text-emerald-200/70">Use o MyWorkout offline.</p>
          </div>
          <button onClick={handleInstallClick} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg active:scale-95 transition-transform">Instalar</button>
        </div>
      )}

      {/* 1. CALENDÁRIO SEMANAL */}
      <div className="rounded-2xl bg-[#1c1c1e] p-5 shadow-lg mb-6 border border-gray-800/50">
        <div className="flex justify-between items-center mb-6">
           <button className="h-8 w-8 rounded-lg bg-[#2c2c2e] text-gray-400 flex items-center justify-center">◀</button>
           <span className="text-sm font-semibold text-gray-300">Esta Semana</span>
           <button className="h-8 w-8 rounded-lg bg-[#2c2c2e] text-gray-400 flex items-center justify-center">▶</button>
        </div>
        <div className="flex justify-between border-t border-gray-800 pt-4">
          {diasSemana.map(dia => (
             <div key={dia.dataIso} className="flex flex-col items-center gap-2">
               <span className={`text-xs font-medium ${dia.isCompleted ? 'text-emerald-500' : 'text-gray-500'}`}>{dia.nome}</span>
               <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${dia.isCompleted ? 'border-emerald-500 bg-transparent text-emerald-500' : 'border-transparent bg-[#2c2c2e]'}`}>
                 {dia.isCompleted && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
               </div>
             </div>
          ))}
        </div>
      </div>

      {/* 2. GRÁFICO DE INTENSIDADE DA SEMANA */}
      <div className="rounded-2xl bg-[#1c1c1e] p-5 shadow-lg mb-6 border border-gray-800/50">
        <h2 className="text-sm font-bold text-gray-100 mb-4">Intensidade da Semana</h2>
        <div className="flex items-end justify-between h-32 pt-2 border-b border-gray-800">
           {volumeSemana.diasGrafico.map((dia, idx) => {
             const barHeight = volumeSemana.maxVolume > 0 ? Math.max((dia.volume / volumeSemana.maxVolume) * 100, 5) : 5;
             return (
               <div key={idx} className="flex flex-col items-center gap-2 w-full">
                 <div className="w-full px-1 sm:px-2 flex justify-center h-full items-end">
                   <div className={`w-full max-w-[24px] rounded-t-sm transition-all duration-500 ${dia.isToday ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-emerald-900/40'}`} style={{ height: `${barHeight}%` }}></div>
                 </div>
                 <span className={`text-[10px] pb-1 ${dia.isToday ? 'text-emerald-500 font-bold' : 'text-gray-500'}`}>{dia.nomeCurto}</span>
               </div>
             );
           })}
        </div>
      </div>

      {/* 3. CARDS DE ESTATÍSTICAS */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-[#1c1c1e] p-5 shadow-lg border border-gray-800/50">
          <span className="mb-2 text-2xl">🏆</span>
          <span className="text-xl font-bold text-emerald-400">{stats.totalWorkouts}</span>
          <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-bold">Treinos</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-[#1c1c1e] p-5 shadow-lg border border-gray-800/50">
          <span className="mb-2 text-2xl">🏋️‍♂️</span>
          <span className="text-xl font-bold text-emerald-400">{stats.volumeText}</span>
          <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-bold">Carga Total</span>
        </div>
        <div className="col-span-2 flex flex-col items-center justify-center rounded-2xl bg-[#1c1c1e] p-5 shadow-lg border border-gray-800/50">
          <span className="mb-2 text-2xl">⭐</span>
          <span className="text-center text-base font-bold text-emerald-400 leading-tight">{stats.favExercise}</span>
          <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-bold">Exercício Favorito</span>
        </div>
      </div>

      {/* 4. FEED DE ATIVIDADES (Timeline) */}
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-gray-100 mb-4">O teu Histórico</h2>
        {workouts.length === 0 && <div className="rounded-2xl border border-dashed border-gray-800 bg-[#1c1c1e]/50 p-6 text-center text-sm text-gray-500 mb-6">Nenhuma atividade registada. Bora começar!</div>}
        
        {workouts.slice().reverse().map(diaWorkout => (
          <div key={diaWorkout.date} className="mb-6">
             <h3 className="mb-4 text-sm font-bold text-gray-100">{formatarDataTimeline(diaWorkout.date)}</h3>
             
             {diaWorkout.completedFichas && diaWorkout.completedFichas.length > 0 ? (
               diaWorkout.completedFichas.map((nomeTreino, idx) => (
                 <div key={idx} className="flex items-center gap-4 border-b border-gray-800/50 pb-5 mb-5 last:border-0 last:mb-0 last:pb-0">
                   <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1c1c1e] border border-gray-700 shadow-inner">
                     <span className="text-2xl">🔥</span>
                     <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border-2 border-[#121212]">
                       <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                     </div>
                   </div>
                   <div className="flex-1">
                     <p className="text-xs font-bold text-emerald-500 mb-1">Check-in realizado</p>
                     <p className="text-sm font-bold text-gray-100">MyWorkout - {nomeTreino}</p>
                     <p className="text-xs text-gray-500 mt-1">{diaWorkout.sets?.length || 0} séries concluídas</p>
                   </div>
                   <div className="text-xs text-gray-400 self-start mt-1">
                     {diaWorkout.sets && diaWorkout.sets.length > 0 ? diaWorkout.sets[diaWorkout.sets.length-1].time : '--:--'}
                   </div>
                 </div>
               ))
             ) : (
               <div className="flex items-center gap-4 border-b border-gray-800/50 pb-5 mb-5">
                   <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1c1c1e] border border-gray-700">
                     <span className="text-2xl">⏳</span>
                   </div>
                   <div className="flex-1">
                     <p className="text-xs font-bold text-gray-500 mb-1">Treino Incompleto</p>
                     <p className="text-sm font-bold text-gray-400">Atividade Parcial</p>
                   </div>
               </div>
             )}
          </div>
        ))}
      </div>

      <button onClick={() => setCurrentTab('treino')} className="mt-8 w-full rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 transition-transform">
        Continuar Treinando
      </button>
    </div>
  );
}
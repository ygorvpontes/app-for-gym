import { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); 
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('MyWorkout instalado com sucesso!');
    }
    setDeferredPrompt(null);
  };

  const [userProfile, setUserProfile] = useLocalStorage('treino_user_profile', {
    name: '', age: '', weight: '', goal: 'Hipertrofia', experience: 'Iniciante', hasOnboarded: false, streak: 0, fichas: [] 
  });
  const [workouts, setWorkouts] = useLocalStorage('treino_workouts_history', []);
  
  const [regData, setRegData] = useState({
    name: userProfile.name || '', age: userProfile.age || '', weight: userProfile.weight || '', goal: userProfile.goal || 'Hipertrofia', experience: userProfile.experience || 'Iniciante'
  });

  const [setupMode, setSetupMode] = useState('escolha');
  const [importText, setImportText] = useState('');
  const [appendMode, setAppendMode] = useState(false); // NOVO: Controle de mesclar treinos
  const [manualFichas, setManualFichas] = useState([{ nome: 'Treino A', exercicios: [] }]);
  
  const [activeFichaIndex, setActiveFichaIndex] = useState(0);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(0);
  const [sets, setSets] = useState(3);
  const [weight, setWeight] = useState(20);
  const [reps, setReps] = useState(10);

  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [showTimerOptions, setShowTimerOptions] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const startTimer = (seconds) => {
    setTimeLeft(seconds); setTimerActive(true); setShowTimerOptions(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60); const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSaveRegistration = () => {
    if (!regData.name.trim()) return alert("Por favor, preencha pelo menos o seu nome!");
    setUserProfile({ ...userProfile, ...regData });
  };

  // === MOTOR DO IMPORTADOR BLINDADO (v3.0) ===
  const handleImportarFicha = () => {
    if (!importText.trim()) return;

    const linhas = importText.split('\n');
    const fichasLimpas = [];
    let fichaAtual = null;

    linhas.forEach(linha => {
      const texto = linha.trim();
      if (!texto) return; // Ignora linhas vazias

      if (texto.toLowerCase().startsWith('treino')) {
        // Limpa nomes sujos tipo "Treino_peito, ombro e triceps:"
        let nomeTreino = texto.replace(/^treino[_\s]*/i, '').replace(/:$/, '').trim();
        fichaAtual = { nome: `Treino ${nomeTreino || 'Novo'}`, exercicios: [] };
        fichasLimpas.push(fichaAtual);
      } else if (fichaAtual) {
        // Ignora bolinhas se existirem
        let linhaLimpa = texto.replace(/^[-•*]\s*/, '').trim();
        let extractedSets = 3, extractedReps = 10;
        
        // Padrão do seu amigo: "3 sérias progressão-35kg 4 reps"
        const matchFriend = linhaLimpa.match(/(\d+)\s*s[ée]ri[ea]s.*?(\d+)\s*reps/i);
        // Padrão antigo: "3x10"
        const matchX = linhaLimpa.match(/(\d+)\s*[xX]\s*([a-zA-Z0-9-]*)/);

        if (matchFriend) {
          extractedSets = parseInt(matchFriend[1]) || 3;
          extractedReps = parseInt(matchFriend[2]) || 10;
          linhaLimpa = linhaLimpa.split(':')[0].trim(); // Pega só o que vem antes dos dois pontos
        } else if (matchX) {
          extractedSets = parseInt(matchX[1]) || 1;
          const repString = matchX[2];
          extractedReps = parseInt(repString) || (repString.toLowerCase().includes('máx') ? 15 : 10);
          linhaLimpa = linhaLimpa.replace(matchX[0], '').trim();
        } else if (linhaLimpa.includes(':')) {
          linhaLimpa = linhaLimpa.split(':')[0].trim(); // Fallback de limpeza
        }

        linhaLimpa = linhaLimpa.replace(/[:—-]\s*$/, '').trim();

        // Regra de saúde articular do Supino
        if (linhaLimpa.toLowerCase().includes('supino reto') && !linhaLimpa.toLowerCase().includes('halter')) {
          linhaLimpa = linhaLimpa.replace(/supino reto/ig, 'Supino Reto com Halteres');
        }

        // Se sobrou algum texto válido, adiciona o exercício
        if (linhaLimpa.length > 2) {
          fichaAtual.exercicios.push({ nome: linhaLimpa, defaultSets: extractedSets, defaultReps: extractedReps });
        }
      }
    });

    if (fichasLimpas.length === 0) return alert("Não encontrei nenhum treino válido. Certifique-se de começar o bloco com a palavra 'Treino'");

    // Lógica de Mesclar ou Substituir
    let novasFichas = fichasLimpas;
    if (appendMode && userProfile.fichas && userProfile.fichas.length > 0) {
      novasFichas = [...userProfile.fichas, ...fichasLimpas];
    }

    setUserProfile({ ...userProfile, hasOnboarded: true, fichas: novasFichas });
    setImportText('');
    alert("Treino processado com sucesso!");
  };

  const addNovaFichaManual = () => {
    const proximaLetra = String.fromCharCode(65 + manualFichas.length);
    setManualFichas([...manualFichas, { nome: `Treino ${proximaLetra}`, exercicios: [] }]);
  };

  const addExercicioManual = (fichaIndex) => {
    const novasFichas = [...manualFichas];
    novasFichas[fichaIndex].exercicios.push({ nome: '', defaultSets: 3, defaultReps: 10 });
    setManualFichas(novasFichas);
  };

  const updateExercicioManual = (fichaIndex, exIndex, campo, valor) => {
    const novasFichas = [...manualFichas];
    novasFichas[fichaIndex].exercicios[exIndex][campo] = valor;
    setManualFichas(novasFichas);
  };

  const salvarFichaManual = () => {
    const fichasLimpas = manualFichas
      .map(ficha => ({ ...ficha, exercicios: ficha.exercicios.filter(ex => ex.nome.trim() !== '') }))
      .filter(ficha => ficha.exercicios.length > 0);

    if (fichasLimpas.length === 0) return alert("Adicione pelo menos um exercício!");
    
    let novasFichas = fichasLimpas;
    if (appendMode && userProfile.fichas && userProfile.fichas.length > 0) {
      novasFichas = [...userProfile.fichas, ...fichasLimpas];
    }
    
    setUserProfile({ ...userProfile, hasOnboarded: true, fichas: novasFichas });
  };

  useEffect(() => { setSelectedExerciseIndex(0); }, [activeFichaIndex]);

  useEffect(() => {
    const fichasSalvas = userProfile.fichas || [];
    if (userProfile.hasOnboarded && fichasSalvas.length > 0) {
      const fichaAtual = fichasSalvas[activeFichaIndex];
      if (fichaAtual && fichaAtual.exercicios && fichaAtual.exercicios.length > selectedExerciseIndex) {
        const exercicioAtual = fichaAtual.exercicios[selectedExerciseIndex];
        setSets(exercicioAtual.defaultSets || 1);
        setReps(exercicioAtual.defaultReps || 10);
      }
    }
  }, [userProfile, activeFichaIndex, selectedExerciseIndex]);

  const handleSaveSet = () => {
    const today = new Date().toISOString().split('T')[0];
    const fichaAtual = userProfile.fichas[activeFichaIndex];
    const exercicioAtual = fichaAtual.exercicios[selectedExerciseIndex];
    
    const newSet = {
      id: crypto.randomUUID(),
      exercise: exercicioAtual.nome,
      sets: sets,
      weight: weight,
      reps: reps,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedWorkouts = [...workouts];
    let todayWorkout = updatedWorkouts.find(w => w.date === today);

    if (todayWorkout) { todayWorkout.sets.push(newSet); } 
    else { updatedWorkouts.push({ date: today, sets: [newSet] }); }
    
    setWorkouts(updatedWorkouts);
  };

  const limparBanco = () => {
    localStorage.clear(); window.location.reload();
  };

  if (!userProfile.name) {
    return (
      <div className="flex min-h-screen flex-col p-6 animate-fade-in">
        <h1 className="mt-8 mb-2 text-3xl font-bold text-emerald-500">Criar Perfil</h1>
        <p className="mb-8 text-sm text-gray-400">Preencha seus dados para personalizar seu app.</p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-300">Como prefere ser chamado?</label>
            <input type="text" value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} placeholder="Seu nome ou apelido" className="w-full rounded-xl bg-gray-900 p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-bold text-gray-300">Idade</label>
              <input type="number" value={regData.age} onChange={e => setRegData({...regData, age: e.target.value})} placeholder="Ex: 25" className="w-full rounded-xl bg-gray-900 p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-bold text-gray-300">Peso (kg)</label>
              <input type="number" value={regData.weight} onChange={e => setRegData({...regData, weight: e.target.value})} placeholder="Ex: 80" className="w-full rounded-xl bg-gray-900 p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-300">Objetivo Principal</label>
            <select value={regData.goal} onChange={e => setRegData({...regData, goal: e.target.value})} className="w-full rounded-xl bg-gray-900 p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="Hipertrofia">Hipertrofia (Ganho de Massa)</option>
              <option value="Emagrecimento">Emagrecimento (Perda de Gordura)</option>
              <option value="Força">Ganho de Força</option>
              <option value="Manutenção">Manutenção de Saúde</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-300">Tempo de Treino</label>
            <select value={regData.experience} onChange={e => setRegData({...regData, experience: e.target.value})} className="w-full rounded-xl bg-gray-900 p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500">
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

  const temFichasValidas = userProfile.fichas && userProfile.fichas.length > 0;

  if (!userProfile.hasOnboarded || !temFichasValidas) {
    return (
      <div className="flex min-h-screen flex-col items-center p-6 text-center animate-fade-in">
        <h1 className="mt-8 mb-2 text-3xl font-bold text-gray-100">Configuração</h1>
        <p className="mb-8 text-sm text-gray-400">Como você deseja adicionar seus treinos, {userProfile.name}?</p>
        
        {setupMode === 'escolha' && (
          <div className="flex w-full flex-col gap-4">
            <button onClick={() => setSetupMode('import')} className="w-full rounded-xl bg-emerald-600 py-6 text-lg font-bold text-white shadow-lg active:bg-emerald-700">📥 Importar treino</button>
            <button onClick={() => setSetupMode('manual')} className="w-full rounded-xl bg-gray-800 py-6 text-lg font-bold text-gray-100 shadow-lg active:bg-gray-700">✍️ Montar Manualmente</button>
          </div>
        )}

        {setupMode === 'import' && (
          <div className="w-full animate-fade-in flex flex-col text-left">
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Cole seu treino aqui..." className="mb-4 h-64 w-full rounded-xl bg-gray-900 p-4 text-sm text-gray-300 outline-none focus:ring-2 focus:ring-emerald-500" />
            
            {/* O CHECKBOX MÁGICO AQUI */}
            <div className="mb-6 flex items-center gap-3 bg-gray-900 p-3 rounded-lg border border-gray-800">
              <input type="checkbox" id="appendMode" checked={appendMode} onChange={(e) => setAppendMode(e.target.checked)} className="h-5 w-5 rounded border-gray-700 bg-gray-800 text-emerald-500" />
              <label htmlFor="appendMode" className="text-sm font-semibold text-gray-300">Adicionar à lista atual (Não apagar anteriores)</label>
            </div>

            <button onClick={handleImportarFicha} className="mb-4 w-full rounded-lg bg-emerald-600 py-4 text-lg font-bold text-white active:bg-emerald-700">Processar e Salvar</button>
            <button onClick={() => setSetupMode('escolha')} className="text-sm text-center text-gray-500 underline mb-8">Voltar</button>
          </div>
        )}

        {setupMode === 'manual' && (
          <div className="w-full animate-fade-in flex flex-col text-left">
            <div className="mb-6 flex items-center gap-3 bg-gray-900 p-3 rounded-lg border border-gray-800">
              <input type="checkbox" id="appendModeManual" checked={appendMode} onChange={(e) => setAppendMode(e.target.checked)} className="h-5 w-5 rounded border-gray-700 bg-gray-800 text-emerald-500" />
              <label htmlFor="appendModeManual" className="text-sm font-semibold text-gray-300">Adicionar à lista atual (Não apagar anteriores)</label>
            </div>

            {manualFichas.map((ficha, fIndex) => (
              <div key={fIndex} className="mb-6 rounded-xl bg-gray-900 p-4">
                <h3 className="mb-4 text-lg font-bold text-emerald-500">{ficha.nome}</h3>
                {ficha.exercicios.map((ex, eIndex) => (
                  <div key={eIndex} className="mb-4 border-l-2 border-gray-700 pl-3">
                    <input type="text" placeholder="Nome do Exercício" value={ex.nome} onChange={(e) => updateExercicioManual(fIndex, eIndex, 'nome', e.target.value)} className="mb-2 w-full rounded-lg bg-gray-800 p-3 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                    <div className="flex gap-2">
                      <div className="flex-1"><label className="text-xs text-gray-400">Séries alvo</label><input type="number" value={ex.defaultSets} onChange={(e) => updateExercicioManual(fIndex, eIndex, 'defaultSets', Number(e.target.value))} className="w-full rounded-lg bg-gray-800 p-2 text-white outline-none" /></div>
                      <div className="flex-1"><label className="text-xs text-gray-400">Reps alvo</label><input type="number" value={ex.defaultReps} onChange={(e) => updateExercicioManual(fIndex, eIndex, 'defaultReps', Number(e.target.value))} className="w-full rounded-lg bg-gray-800 p-2 text-white outline-none" /></div>
                    </div>
                  </div>
                ))}
                <button onClick={() => addExercicioManual(fIndex)} className="w-full rounded-lg bg-gray-800 py-3 text-sm font-bold text-emerald-400 border border-emerald-900/50">+ Adicionar Exercício</button>
              </div>
            ))}
            <button onClick={addNovaFichaManual} className="mb-6 w-full rounded-lg bg-gray-800 py-4 text-sm font-bold text-gray-300 border border-gray-700 shadow-md">+ Adicionar Novo Treino</button>
            <button onClick={salvarFichaManual} className="mb-4 w-full rounded-lg bg-emerald-600 py-4 text-lg font-bold text-white shadow-lg active:bg-emerald-700">Salvar Todas as Fichas</button>
            <button onClick={() => setSetupMode('escolha')} className="text-sm text-center text-gray-500 underline mb-8">Voltar</button>
          </div>
        )}
        
        {userProfile.name && (<button onClick={limparBanco} className="mt-8 text-xs text-red-500 underline">Voltar ao Cadastro (Resetar)</button>)}
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todaysSets = workouts.find(w => w.date === today)?.sets || [];
  const fichaAtual = userProfile.fichas[activeFichaIndex];

  return (
    <div className="flex min-h-screen flex-col p-4 pb-24 relative animate-fade-in">
      <header className="mb-6 flex items-center justify-between border-b border-gray-800 pb-4 pt-2">
        <div>
          <h1 className="text-xl font-bold text-emerald-500">Fala, {userProfile.name}!</h1>
          <p className="text-xs text-gray-400">{userProfile.goal} • {userProfile.experience}</p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-full bg-gray-900 px-3 py-1 text-sm font-bold text-orange-500">🔥 {userProfile.streak}</div>
          <button onClick={limparBanco} className="rounded-full bg-red-900/50 px-3 py-1 text-sm text-red-200">Sair</button>
        </div>
      </header>

      {deferredPrompt && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-emerald-900/30 border border-emerald-800 p-4 animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-emerald-400">Instalar MyWorkout</h3>
            <p className="text-xs text-emerald-200/70">Adicione à tela inicial para usar offline.</p>
          </div>
          <button onClick={handleInstallClick} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg active:bg-emerald-700">Instalar</button>
        </div>
      )}

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {userProfile.fichas.map((ficha, index) => (
          <button key={index} onClick={() => setActiveFichaIndex(index)} className={`whitespace-nowrap rounded-lg px-6 py-2 text-sm font-bold transition-colors ${activeFichaIndex === index ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {ficha.nome}
          </button>
        ))}
        {/* Botão rápido para adicionar mais treinos na interface principal */}
        <button onClick={() => {
          setUserProfile({...userProfile, hasOnboarded: false});
          setSetupMode('escolha');
          setAppendMode(true);
        }} className="whitespace-nowrap rounded-lg px-6 py-2 text-sm font-bold bg-gray-800 text-emerald-500 border border-emerald-900/50 hover:bg-gray-700">
          + Novo Treino
        </button>
      </div>

      <section className="mb-8 rounded-2xl bg-gray-900 p-4 shadow-lg">
        <label className="mb-2 block text-sm font-semibold text-gray-400">Exercício</label>
        
        <select value={selectedExerciseIndex} onChange={(e) => setSelectedExerciseIndex(Number(e.target.value))} className="mb-6 w-full rounded-xl bg-gray-800 p-4 text-base text-gray-100 outline-none focus:ring-2 focus:ring-emerald-500">
          {fichaAtual.exercicios.map((ex, idx) => (
            <option key={idx} value={idx}>{ex.nome}</option>
          ))}
        </select>

        <div className="mb-6 flex gap-2">
          <div className="flex-1">
            <label className="mb-2 block text-center text-xs font-semibold text-gray-400">Séries</label>
            <div className="flex items-center justify-between rounded-xl bg-gray-800 p-1 sm:p-2">
              <button onClick={() => setSets(s => Math.max(1, s - 1))} className="flex h-12 w-10 items-center justify-center rounded-lg bg-gray-700 text-xl font-bold active:bg-gray-600">-</button>
              <span className="text-xl font-bold text-gray-100">{sets}</span>
              <button onClick={() => setSets(s => s + 1)} className="flex h-12 w-10 items-center justify-center rounded-lg bg-gray-700 text-xl font-bold active:bg-gray-600">+</button>
            </div>
          </div>
          <div className="flex-1">
            <label className="mb-2 block text-center text-xs font-semibold text-gray-400">Peso (kg)</label>
            <div className="flex items-center justify-between rounded-xl bg-gray-800 p-1 sm:p-2">
              <button onClick={() => setWeight(w => Math.max(0, w - 1))} className="flex h-12 w-10 items-center justify-center rounded-lg bg-gray-700 text-xl font-bold active:bg-gray-600">-</button>
              <span className="text-xl font-bold text-gray-100">{weight}</span>
              <button onClick={() => setWeight(w => w + 1)} className="flex h-12 w-10 items-center justify-center rounded-lg bg-gray-700 text-xl font-bold active:bg-gray-600">+</button>
            </div>
          </div>
          <div className="flex-1">
            <label className="mb-2 block text-center text-xs font-semibold text-gray-400">Reps</label>
            <div className="flex items-center justify-between rounded-xl bg-gray-800 p-1 sm:p-2">
              <button onClick={() => setReps(r => Math.max(0, r - 1))} className="flex h-12 w-10 items-center justify-center rounded-lg bg-gray-700 text-xl font-bold active:bg-gray-600">-</button>
              <span className="text-xl font-bold text-gray-100">{reps}</span>
              <button onClick={() => setReps(r => r + 1)} className="flex h-12 w-10 items-center justify-center rounded-lg bg-gray-700 text-xl font-bold active:bg-gray-600">+</button>
            </div>
          </div>
        </div>

        <button onClick={handleSaveSet} className="w-full rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white shadow-md active:bg-emerald-700">+ Salvar Registro</button>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-100">Registros de Hoje</h2>
        {todaysSets.length === 0 ? (
          <p className="text-center text-gray-500">Nenhum registro hoje.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {todaysSets.map((set, index) => (
              <div key={set.id} className="flex items-center justify-between rounded-lg bg-gray-900 p-4">
                <div className="flex flex-col">
                  <span className="font-bold text-gray-100">{set.exercise}</span>
                  <span className="text-xs text-gray-400">Reg. {index + 1} • {set.time}</span>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-emerald-400">{set.weight} kg</span>
                  <span className="block text-xs text-gray-400">{set.sets} séries x {set.reps} reps</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="fixed bottom-6 right-6 flex flex-col items-end">
        {showTimerOptions && (
          <div className="mb-4 flex flex-col gap-2 rounded-xl bg-gray-800 p-3 shadow-lg animate-fade-in border border-gray-700">
            <button onClick={() => startTimer(60)} className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-bold text-emerald-400 active:bg-gray-600">1:00 min</button>
            <button onClick={() => startTimer(90)} className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-bold text-emerald-400 active:bg-gray-600">1:30 min</button>
            <button onClick={() => startTimer(120)} className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-bold text-emerald-400 active:bg-gray-600">2:00 min</button>
          </div>
        )}
        <button onClick={() => { if (timerActive) setTimerActive(false); else setShowTimerOptions(!showTimerOptions); }} className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold shadow-xl transition-colors ${timerActive ? 'bg-orange-600 text-white animate-pulse shadow-orange-900/50' : 'bg-indigo-600 text-white shadow-indigo-900/50 hover:bg-indigo-500'}`}>
          {timerActive ? formatTime(timeLeft) : '⏱️'}
        </button>
      </div>
    </div>
  );
}

export default App;
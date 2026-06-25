import { useState } from 'react';

export function SetupTreinos({ 
  userProfile, 
  setUserProfile, 
  currentModalidades, 
  activeModalidadeIndex, 
  setActiveModalidadeIndex,
  modalidadeSelectorNode,
  onOpenModalidades
}) {
  const temFichasValidas = currentModalidades[activeModalidadeIndex]?.fichas?.length > 0;

  const [setupMode, setSetupMode] = useState('escolha');
  const [importText, setImportText] = useState('');
  const [appendMode, setAppendMode] = useState(temFichasValidas);
  const [manualFichas, setManualFichas] = useState([{ nome: 'Treino A', exercicios: [] }]);

  const handleImportarFicha = () => {
    if (!importText.trim()) return;
    const linhas = importText.split('\n');
    const fichasLimpas = [];
    let fichaAtual = null;

    linhas.forEach(linha => {
      let texto = linha.trim();
      if (!texto || !/[a-zA-Z0-9]/.test(texto)) return;

      if (texto.toLowerCase().startsWith('treino')) {
        let nomeTreino = texto.replace(/^treino[_\s]*/i, '').replace(/:$/, '').trim();
        fichaAtual = { nome: `Treino ${nomeTreino || 'Novo'}`, exercicios: [] };
        fichasLimpas.push(fichaAtual);
      } else if (fichaAtual) {
        let linhaLimpa = texto.replace(/^[-•*—_]+\s*/, '').trim();
        if (linhaLimpa.toLowerCase().startsWith('nota')) {
          if (fichaAtual.exercicios.length > 0) {
            fichaAtual.exercicios[fichaAtual.exercicios.length - 1].nota = linhaLimpa.replace(/^notas?\s*:?\s*/i, '').trim() || 'Observação...';
          }
          return; 
        }

        let extractedSets = 3, extractedReps = 10;
        const matchFriend = linhaLimpa.match(/(\d+)\s*s[ée]ri[ea]s.*?(\d+)\s*reps/i);
        const matchX = linhaLimpa.match(/(\d+)\s*[xX]\s*([a-zA-Z0-9-]*)/);

        if (matchFriend) {
          extractedSets = parseInt(matchFriend[1]) || 3;
          extractedReps = parseInt(matchFriend[2]) || 10;
          linhaLimpa = linhaLimpa.split(':')[0].trim(); 
        } else if (matchX) {
          extractedSets = parseInt(matchX[1]) || 1;
          const repString = matchX[2];
          extractedReps = parseInt(repString) || (repString.toLowerCase().includes('máx') ? 15 : 10);
          linhaLimpa = linhaLimpa.replace(matchX[0], '').trim();
        } else if (linhaLimpa.includes(':')) {
          linhaLimpa = linhaLimpa.split(':')[0].trim(); 
        }

        linhaLimpa = linhaLimpa.replace(/[:—-]\s*$/, '').trim();
        if (linhaLimpa.toLowerCase().includes('supino reto') && !linhaLimpa.toLowerCase().includes('halter')) {
          linhaLimpa = linhaLimpa.replace(/supino reto/ig, 'Supino Reto com Halteres');
        }

        if (linhaLimpa.length > 2) {
          fichaAtual.exercicios.push({ nome: linhaLimpa, defaultSets: extractedSets, defaultReps: extractedReps, nota: '' });
        }
      }
    });

    if (fichasLimpas.length === 0) return alert("Não encontrei nenhum treino válido.");

    const mods = [...currentModalidades];
    let novasFichas = appendMode && mods[activeModalidadeIndex].fichas ? [...mods[activeModalidadeIndex].fichas, ...fichasLimpas] : fichasLimpas;
    mods[activeModalidadeIndex].fichas = novasFichas;
    
    setUserProfile({ ...userProfile, hasOnboarded: true, modalidades: mods });
    setImportText('');
    alert("Treino processado com sucesso!");
  };

  const addNovaFichaManual = () => {
    const proximaLetra = String.fromCharCode(65 + manualFichas.length);
    setManualFichas([...manualFichas, { nome: `Treino ${proximaLetra}`, exercicios: [] }]);
  };

  const updateFichaNomeManual = (fichaIndex, novoNome) => {
    const novasFichas = [...manualFichas];
    novasFichas[fichaIndex].nome = novoNome;
    setManualFichas(novasFichas);
  };

  const addExercicioManual = (fichaIndex) => {
    const novasFichas = [...manualFichas];
    novasFichas[fichaIndex].exercicios.push({ nome: '', defaultSets: 3, defaultReps: 10, nota: '' });
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
    
    const mods = [...currentModalidades];
    let novasFichas = appendMode && mods[activeModalidadeIndex].fichas ? [...mods[activeModalidadeIndex].fichas, ...fichasLimpas] : fichasLimpas;
    mods[activeModalidadeIndex].fichas = novasFichas;
    
    setUserProfile({ ...userProfile, hasOnboarded: true, modalidades: mods });
  };

  return (
    <div className="flex min-h-screen flex-col p-6 text-center animate-fade-in bg-[#121212] text-white relative">
      {modalidadeSelectorNode}
      
      {userProfile.hasOnboarded && (
          <button onClick={onOpenModalidades} className="absolute top-6 right-6 flex items-center gap-1 bg-[#1c1c1e] px-3 py-2 rounded-xl border border-gray-800 text-xs font-bold text-emerald-400 shadow-sm active:scale-95 transition-transform">
             {currentModalidades[activeModalidadeIndex]?.nome} ▾
          </button>
      )}

      <h1 className="mt-12 mb-2 text-3xl font-bold text-gray-100">Configuração</h1>
      <p className="mb-8 text-sm text-gray-400">Como você deseja adicionar seus treinos, {userProfile.name}?</p>
      
      {setupMode === 'escolha' && (
        <div className="flex w-full flex-col gap-4">
          <button onClick={() => setSetupMode('import')} className="w-full rounded-xl bg-emerald-600 py-6 text-lg font-bold text-white shadow-lg active:bg-emerald-700">📥 Importar treino</button>
          <button onClick={() => setSetupMode('manual')} className="w-full rounded-xl bg-[#1c1c1e] py-6 text-lg font-bold text-gray-100 shadow-lg border border-gray-800 active:bg-[#2c2c2e]">✍️ Montar Manualmente</button>
          
          {currentModalidades.length > 1 && !temFichasValidas && (
            <button onClick={() => setActiveModalidadeIndex(0)} className="mt-6 text-sm font-semibold text-gray-500 underline hover:text-gray-400 transition-colors">
              ← Voltar para {currentModalidades[0].nome}
            </button>
          )}
          
          {temFichasValidas && (
            <button onClick={() => setUserProfile({...userProfile, hasOnboarded: true})} className="mt-6 text-sm font-semibold text-gray-500 underline hover:text-gray-400 transition-colors">
              ← Cancelar e Voltar para os Treinos
            </button>
          )}
        </div>
      )}

      {setupMode === 'import' && (
        <div className="w-full animate-fade-in flex flex-col text-left">
          <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Cole seu treino aqui..." className="mb-4 h-64 w-full rounded-xl bg-[#1c1c1e] p-4 text-sm text-gray-300 outline-none border border-gray-800 focus:ring-2 focus:ring-emerald-500" />
          <div className="mb-6 flex items-center gap-3 bg-[#1c1c1e] p-3 rounded-lg border border-gray-800">
            <input type="checkbox" id="appendMode" checked={appendMode} onChange={(e) => setAppendMode(e.target.checked)} className="h-5 w-5 rounded border-gray-700 bg-[#2c2c2e] text-emerald-500" />
            <label htmlFor="appendMode" className="text-sm font-semibold text-gray-300">Adicionar à lista atual</label>
          </div>
          <button onClick={handleImportarFicha} className="mb-4 w-full rounded-lg bg-emerald-600 py-4 text-lg font-bold text-white active:bg-emerald-700">Processar e Salvar</button>
          <button onClick={() => setSetupMode('escolha')} className="text-sm text-center text-gray-500 underline mb-8">Voltar</button>
        </div>
      )}

      {setupMode === 'manual' && (
        <div className="w-full animate-fade-in flex flex-col text-left">
          <div className="mb-6 flex items-center gap-3 bg-[#1c1c1e] p-3 rounded-lg border border-gray-800">
            <input type="checkbox" id="appendModeManual" checked={appendMode} onChange={(e) => setAppendMode(e.target.checked)} className="h-5 w-5 rounded border-gray-700 bg-[#2c2c2e] text-emerald-500" />
            <label htmlFor="appendModeManual" className="text-sm font-semibold text-gray-300">Adicionar à lista atual</label>
          </div>
          {manualFichas.map((ficha, fIndex) => (
            <div key={fIndex} className="mb-6 rounded-xl bg-[#1c1c1e] border border-gray-800 p-4">
              <input type="text" value={ficha.nome} onChange={(e) => updateFichaNomeManual(fIndex, e.target.value)} placeholder="Ex: Perna e Glúteo" className="mb-4 w-full bg-transparent text-lg font-bold text-emerald-500 border-b border-gray-700 pb-1 outline-none focus:border-emerald-500 transition-colors" />
              {ficha.exercicios.map((ex, eIndex) => (
                <div key={eIndex} className="mb-4 border-l-2 border-gray-700 pl-3">
                  <input type="text" placeholder="Nome do Exercício" value={ex.nome} onChange={(e) => updateExercicioManual(fIndex, eIndex, 'nome', e.target.value)} className="mb-2 w-full rounded-lg bg-[#2c2c2e] p-3 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  <div className="flex gap-2">
                    <div className="flex-1"><label className="text-xs text-gray-400">Séries alvo</label><input type="number" value={ex.defaultSets} onChange={(e) => updateExercicioManual(fIndex, eIndex, 'defaultSets', Number(e.target.value))} className="w-full rounded-lg bg-[#2c2c2e] p-2 text-white outline-none" /></div>
                    <div className="flex-1"><label className="text-xs text-gray-400">Reps alvo</label><input type="number" value={ex.defaultReps} onChange={(e) => updateExercicioManual(fIndex, eIndex, 'defaultReps', Number(e.target.value))} className="w-full rounded-lg bg-[#2c2c2e] p-2 text-white outline-none" /></div>
                  </div>
                </div>
              ))}
              <button onClick={() => addExercicioManual(fIndex)} className="w-full rounded-lg bg-[#2c2c2e] py-3 text-sm font-bold text-emerald-400 border border-emerald-900/50">+ Adicionar Exercício</button>
            </div>
          ))}
          <button onClick={addNovaFichaManual} className="mb-6 w-full rounded-lg bg-[#2c2c2e] py-4 text-sm font-bold text-gray-300 border border-gray-700 shadow-md">+ Adicionar Novo Treino</button>
          <button onClick={salvarFichaManual} className="mb-4 w-full rounded-lg bg-emerald-600 py-4 text-lg font-bold text-white shadow-lg active:bg-emerald-700">Salvar Todas as Fichas</button>
          <button onClick={() => setSetupMode('escolha')} className="text-sm text-center text-gray-500 underline mb-8">Voltar</button>
        </div>
      )}
    </div>
  );
}
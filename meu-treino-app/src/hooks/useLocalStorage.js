import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  // 1. LER OS DADOS: O useState aceita uma função para inicializar o valor.
  // Fazemos isso para que ele só vá buscar no localStorage na primeira vez que a tela carregar.
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      // Se já existir algo salvo com essa 'key', transformamos de texto (JSON) para objeto Javascript.
      // Se não existir, retornamos o 'initialValue' que definirmos.
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Erro ao ler do localStorage", error);
      return initialValue;
    }
  });

  // 2. SALVAR OS DADOS: O useEffect "observa" variáveis.
  // Toda vez que a 'key' ou o 'value' mudarem, ele executa o bloco abaixo, salvando no banco.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Erro ao salvar no localStorage", error);
    }
  }, [key, value]);

  // Retornamos um array igual ao useState padrão, para usarmos da mesma forma nos componentes.
  return [value, setValue];
}
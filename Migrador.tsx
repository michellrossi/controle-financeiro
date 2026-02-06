import React, { useState } from 'react'; // Adicionado import do React e useState
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "./services/storage"; 

export const Migrador = ({ userId }: { userId: string }) => {
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const appId = "default-app-id";

  // A lógica de migração deve estar dentro desta função
  const iniciarMigracao = async () => {
    console.log("Iniciando migração para o usuário:", userId);
    setStatus('running');

    try {
      // 1. Migrar Transações
      const caminhoAntigoTx = collection(db, "artifacts", appId, "users", userId, "transactions");
      const snapshotTx = await getDocs(caminhoAntigoTx);
      
      for (const documento of snapshotTx.docs) {
        const dados = documento.data();
        await addDoc(collection(db, "transactions"), {
          ...dados,
          userId: userId 
        });
      }

      // 2. Migrar Cartões
      const caminhoAntigoCards = collection(db, "artifacts", appId, "users", userId, "cards");
      const snapshotCards = await getDocs(caminhoAntigoCards);
      
      for (const documento of snapshotCards.docs) {
        const dados = documento.data();
        await addDoc(collection(db, "cards"), {
          ...dados,
          userId: userId
        });
      }

      setStatus('done');
      alert("Migração concluída com sucesso! Recarregue a página.");
    } catch (error) {
      console.error("Erro na migração:", error);
      alert("Ocorreu um erro. Verifique o console.");
      setStatus('idle');
    }
  };

  // Linha comentada conforme solicitado para forçar a exibição
  // if (status === 'done') return null;

  return (
    <div style={{ position: 'relative', zIndex: 9999 }} className="bg-amber-50 border-2 border-amber-200 p-6 rounded-2xl my-6">
      <h3 style={{ color: '#92400e', fontWeight: 'bold' }}>⚠️ Painel de Migração de Dados</h3>
      <p style={{ color: '#92400e', margin: '10px 0' }}>Clique no botão abaixo para mover seus dados antigos para a nova estrutura.</p>
      <button 
        onClick={iniciarMigracao}
        disabled={status === 'running'}
        style={{ 
          background: '#f59e0b', 
          color: 'white', 
          padding: '10px 20px', 
          borderRadius: '8px', 
          fontWeight: 'bold', 
          border: 'none', 
          cursor: status === 'running' ? 'not-allowed' : 'pointer',
          opacity: status === 'running' ? 0.7 : 1
        }}
      >
        {status === 'running' ? 'MIGRANDO...' : 'MIGRAR MEUS DADOS AGORA'}
      </button>
    </div>
  );
};
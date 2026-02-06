import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "./services/storage"; // Importa sua conexão com Firebase

export const Migrador = ({ userId }: { userId: string }) => {
  const iniciarMigracao = async () => {
    const appId = "default-app-id";
    console.log("Iniciando migração para o usuário:", userId);

    try {
      // 1. Migrar Transações
      const caminhoAntigoTx = collection(db, "artifacts", appId, "users", userId, "transactions");
      const snapshotTx = await getDocs(caminhoAntigoTx);
      
      for (const documento of snapshotTx.docs) {
        const dados = documento.data();
        await addDoc(collection(db, "transactions"), {
          ...dados,
          userId: userId // Adiciona o campo obrigatório para a nova versão
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

      alert("Migração concluída com sucesso! Verifique o console do navegador.");
    } catch (error) {
      console.error("Erro na migração:", error);
      alert("Ocorreu um erro. Verifique o console.");
    }
  };

  return (
    <div style={{ padding: '20px', background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '12px', margin: '20px 0' }}>
      <h3 style={{ color: '#92400e' }}>⚠️ Painel de Migração de Dados</h3>
      <p>Clique no botão abaixo para mover seus dados antigos para a nova estrutura.</p>
      <button 
        onClick={iniciarMigracao}
        style={{ background: '#f59e0b', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
      >
        MIGRAR MEUS DADOS AGORA
      </button>
    </div>
  );
};
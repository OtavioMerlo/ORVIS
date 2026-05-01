import os
import chromadb
from dotenv import load_dotenv

load_dotenv()

class ORVISMemory:
    def __init__(self, db_path=None):
        # Caminho padrão: data/memory (relativo à raiz do projeto)
        if db_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            db_path = os.path.join(base_dir, "data", "memory")
        
        self.client = chromadb.PersistentClient(path=db_path)
        self.collection = self.client.get_or_create_collection(
            name="orvis_long_term_memory"
        )

    def add_memory(self, text, metadata=None):
        """Adiciona uma nova memória ao sistema localmente."""
        count = self.collection.count()
        mem_id = f"mem_{count + 1}"
        
        self.collection.add(
            documents=[text],
            metadatas=[metadata] if metadata else [{"source": "conversation"}],
            ids=[mem_id]
        )
        return f"Memória guardada com sucesso: {text[:50]}..."

    def search_memory(self, query, n_results=3, min_score=None):
        """Busca memórias relevantes usando processamento local."""
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                include=["documents", "metadatas", "distances"]
            )
            
            if not results['documents'] or len(results['documents'][0]) == 0:
                return "Nenhuma memória relevante encontrada."
                
            docs = results['documents'][0]
            dists = results['distances'][0]
            
            filtered_memories = []
            for doc, dist in zip(docs, dists):
                if min_score is None or dist < min_score:
                    filtered_memories.append(doc)

            if not filtered_memories:
                return "Nenhuma memória relevante encontrada com precisão."

            return "\n".join([f"- {m}" for m in filtered_memories])
        except Exception as e:
            return f"Erro ao buscar memória: {e}"

    def get_all_memories(self, limit=10):
        """Retorna as últimas memórias inseridas."""
        try:
            results = self.collection.peek(limit=limit)
            if not results['documents']:
                return "Memória vazia."
            return "\n".join([f"- {m}" for m in results['documents']])
        except Exception as e:
            return f"Erro ao acessar BD: {e}"

if __name__ == "__main__":
    memory = ORVISMemory()
    print("Busca de teste: " + memory.search_memory("Quem é Otávio?"))

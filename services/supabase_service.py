import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class ORVISSupabase:
    def __init__(self):
        url: str = os.getenv("SUPABASE_URL")
        key: str = os.getenv("SUPABASE_KEY")
        if not url or not key:
            print("⚠️ Supabase: Credenciais não encontradas no .env")
            self.client = None
        else:
            self.client: Client = create_client(url, key)

    def save_vitoria_info(self, category: str, content: str, importance: int = 3):
        """
        Salva uma informação sobre a Vitória no Supabase.
        Categorias sugeridas: 'saúde', 'rotina', 'humor', 'aviso'.
        Importância: 1 (baixa) a 5 (urgente).
        """
        if not self.client:
            return "Erro: Supabase não configurado."

        try:
            data = {
                "category": category,
                "content": content,
                "importance": importance,
                "agent": "Cloe"
            }
            # Assume-se que existe uma tabela chamada 'vitoria_logs'
            response = self.client.table("vitoria_logs").insert(data).execute()
            return f"Informação salva com sucesso no Supabase: {content}"
        except Exception as e:
            print(f"Erro ao salvar no Supabase: {e}")
            return f"Erro ao salvar no banco de dados: {str(e)}"

    def get_latest_logs(self, limit: int = 10):
        """Recupera os últimos registros da Vitória."""
        if not self.client: return []
        try:
            response = self.client.table("vitoria_logs").select("*").order("created_at", desc=True).limit(limit).execute()
            return response.data
        except Exception as e:
            print(f"Erro ao buscar no Supabase: {e}")
            return []

    def delete_log(self, log_id: int):
        """Remove um registro específico pelo ID."""
        if not self.client: return "Erro: Supabase não configurado."
        try:
            self.client.table("vitoria_logs").delete().eq("id", log_id).execute()
            return f"Registro ID {log_id} removido com sucesso do Supabase."
        except Exception as e:
            print(f"Erro ao deletar no Supabase: {e}")
            return f"Erro ao deletar registro: {str(e)}"

supabase_svc = ORVISSupabase()

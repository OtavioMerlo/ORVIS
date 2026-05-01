import json
import os
from datetime import datetime


class ORVISTaskManager:
    def __init__(self, db_path=None):
        # Caminho padrão: data/tasks.json (relativo à raiz do projeto)
        if db_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            db_path = os.path.join(base_dir, "data", "tasks.json")
        self.db_path = db_path
        self.tasks = self._load_tasks()

    def _load_tasks(self):
        if os.path.exists(self.db_path):
            with open(self.db_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []

    def _save_tasks(self):
        with open(self.db_path, 'w', encoding='utf-8') as f:
            json.dump(self.tasks, f, indent=4, ensure_ascii=False)

    def add_task(self, description, priority="Média", deadline=None):
        """Adiciona uma nova tarefa ou compromisso."""
        new_task = {
            "id": len(self.tasks) + 1,
            "descricao": description,
            "prioridade": priority,
            "prazo": deadline,
            "status": "pendente",
            "criado_em": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        self.tasks.append(new_task)
        self._save_tasks()
        return f"✅ Tarefa anotada: '{description}' (Prioridade: {priority})"

    def list_tasks(self, filter_status="pendente"):
        """Lista as tarefas filtradas por status."""
        filtered = [t for t in self.tasks if t["status"] == filter_status]
        if not filtered:
            return f"Nenhuma tarefa {filter_status} encontrada."
        
        res = f"### Suas Tarefas ({filter_status.capitalize()}):\n"
        for t in filtered:
            prazo = t['prazo'] if t['prazo'] else "Sem prazo"
            res += f"- [{t['id']}] {t['descricao']} | Prioridade: {t['prioridade']} | Prazo: {prazo}\n"
        return res

    def complete_task(self, task_id):
        """Marca uma tarefa como concluída."""
        if task_id is None: return "Erro: ID da tarefa não fornecido."
        try:
            target_id = int(task_id)
        except (ValueError, TypeError):
            return "Erro: ID da tarefa deve ser um número."
            
        for t in self.tasks:
            if t["id"] == target_id:
                t["status"] = "concluida"
                self._save_tasks()
                return f"🌟 Parabéns! Tarefa '{t['descricao']}' concluída."
        return "Tarefa não encontrada."

    def get_agenda_today(self):
        """Busca o que tem para hoje."""
        today = datetime.now().strftime("%Y-%m-%d")
        today_tasks = [t for t in self.tasks if t["prazo"] and today in t["prazo"]]
        
        if not today_tasks:
            return "Sua agenda está livre para hoje, Otávio."
        
        res = "📅 Agenda de Hoje:\n"
        for t in today_tasks:
            res += f"- {t['descricao']} ({t['prioridade']})\n"
        return res

    def delete_task(self, task_id):
        """Remove uma tarefa."""
        if task_id is None: return "Erro: ID da tarefa não fornecido."
        try:
            target_id = int(task_id)
        except (ValueError, TypeError):
            return "Erro: ID da tarefa deve ser um número."

        original_count = len(self.tasks)
        self.tasks = [t for t in self.tasks if t["id"] != target_id]
        
        if len(self.tasks) < original_count:
            self._save_tasks()
            return f"Tarefa {target_id} removida."
        return "Tarefa não encontrada para exclusão."

    def edit_task(self, task_id, description=None, priority=None, deadline=None):
        """Edita uma tarefa existente."""
        if task_id is None: return "Erro: ID da tarefa não fornecido."
        try:
            target_id = int(task_id)
        except (ValueError, TypeError):
            return "Erro: ID da tarefa deve ser um número."

        for t in self.tasks:
            if t["id"] == target_id:
                if description: t["descricao"] = description
                if priority: t["prioridade"] = priority
                if deadline: t["prazo"] = deadline
                self._save_tasks()
                return f"📝 Tarefa {target_id} atualizada com sucesso!"
        return "Tarefa não encontrada para edição."

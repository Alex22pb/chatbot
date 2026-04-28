import mysql.connector
from sklearn.feature_extraction.text import TfidfVectorizer


class BuscadorTFIDF:
    def __init__(self):
        self.ids = []
        self.nomes = []
        self.documentos = []
        self.vectorizer = None
        self.matriz = None

        self.carregar_dados()

    def conectar(self):
        return mysql.connector.connect(
            host="localhost",
            user="chatbot",
            password="chatbot",
            database="chatbot"
        )

    def carregar_dados(self):
        conn = self.conectar()
        cursor = conn.cursor()

        cursor.execute("SELECT iddocumento, titulo, conteudo FROM documento")

        self.ids.clear()
        self.nomes.clear()
        self.documentos.clear()

        for (id_, nome, conteudo) in cursor.fetchall():
            self.ids.append(id_)
            self.nomes.append(nome)
            self.documentos.append(conteudo)

        conn.close()

        self.vectorizer = TfidfVectorizer()
        self.matriz = self.vectorizer.fit_transform(self.documentos)

    def buscar(self, query, documentos_prioritarios=None, top_k=5):
        if not self.vectorizer:
            return []

        query_lower = query.lower()
        query_formatada = query_lower.replace(" ", "_")

        query_vec = self.vectorizer.transform([query])
        similaridades = (self.matriz * query_vec.T).toarray().flatten()

        resultados = []

        max_score = max(similaridades) if len(similaridades) > 0 else 0

        for i, score in enumerate(similaridades):
            id_doc = self.ids[i]
            nome_doc = self.nomes[i].lower()

            score_final = float(score)

            # PRIORIDADE DO USUÁRIO (peso adaptativo)
            if documentos_prioritarios and id_doc in documentos_prioritarios:
                score_final += max_score * 0.7

            # MATCH EXATO (kick off → kick_off)
            if query_formatada in nome_doc:
                score_final += max_score * 0.8

            # MATCH PARCIAL (palavras separadas)
            for termo in query_lower.split():
                if termo in nome_doc:
                    score_final += max_score * 0.2

            resultados.append({
                "id": id_doc,
                "nome": self.nomes[i],
                "score": score_final
            })

        resultados = sorted(resultados, key=lambda x: x["score"], reverse=True)

        return resultados[:top_k]
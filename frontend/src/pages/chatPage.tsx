import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { criarConversa, listarConversas, deletarConversa, iniciarNovaConversa } from "../services/conversaService";
import type { ConversaResponse } from "../services/conversaService";

import { listarDocumentos } from "../services/documentoService";
import type { DocumentoResponse } from "../services/documentoService";

import { enviarMensagem, listarMensagens } from "../services/mensagemService";
import type { MensagemResponse } from "../services/mensagemService";

import { listarRespostas } from "../services/respostaService";
import type { Resposta } from "../services/respostaService";

type ChatItem = {
  id: number;
  conteudo: string;
  tipo: "usuario" | "resposta";
};

export default function ChatPage() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState<{ nome: string; id: number } | null>(null);
  const [conversas, setConversas] = useState<ConversaResponse[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoResponse[]>([]);
  const [documentosSelecionados, setDocumentosSelecionados] = useState<DocumentoResponse[]>([]);
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [mensagemInput, setMensagemInput] = useState("");
  const [conversaAtiva, setConversaAtiva] = useState<number | null>(null);
  const [perguntaRespondida, setPerguntaRespondida] = useState<boolean>(true);

  // Carrega usuário
  useEffect(() => {
    const usuarioLogado = localStorage.getItem("usuario");

    if (usuarioLogado) {
      const u = JSON.parse(usuarioLogado);
      setUsuario(u);
      carregarConversas(u.id);
      carregarDocumentos(u.id);
    } else {
      navigate("/login");
    }
  }, []);

// Carrega mensagens + respostas de uma conversa
async function carregarChat(idconversa: number) {
  try {
    // 1️⃣ Buscar mensagens
    const mensagens: MensagemResponse[] = await listarMensagens(idconversa);
    console.log("Mensagens recebidas:", mensagens);

    // 2️⃣ Buscar respostas
    const respostasMap = await listarRespostas(idconversa);
    console.log("Respostas recebidas (respostasMap):", respostasMap);
    console.log("Tipo de respostasMap:", typeof respostasMap);

    const chatItems: ChatItem[] = [];

    mensagens.forEach((msg) => {
      console.log("Processando mensagem:", msg);

      chatItems.push({ id: msg.idmensagem, conteudo: msg.conteudo, tipo: "usuario" });

      const respostas: Resposta[] = Array.isArray(respostasMap[msg.idmensagem])
        ? respostasMap[msg.idmensagem]
        : [];

      console.log(`Respostas associadas à mensagem ${msg.idmensagem}:`, respostas);

      respostas.forEach((r) =>
        chatItems.push({ id: r.idresposta, conteudo: r.conteudo, tipo: "resposta" })
      );
    });

    console.log("Chat final:", chatItems);

    setChat(chatItems);
  } catch (error) {
    console.error("Erro ao carregar chat:", error);
  }
}

  async function handleEnviarMensagem() {
    if (!mensagemInput.trim() || !usuario) return;

    try {
      let idConversa = conversaAtiva;
      setPerguntaRespondida(false);

      if (!idConversa) {
        const nova = await iniciarNovaConversa(usuario.id);
        idConversa = nova.idconversa;
        setConversaAtiva(idConversa);
        await carregarConversas(usuario.id);
      }

      // Envia a mensagem
      const res = await enviarMensagem({
        conteudo: mensagemInput,
        idconversa: idConversa,
        documentos_prioritarios: documentosSelecionados.map (d => d.iddocumento)
      });

      setMensagemInput("");
      await carregarChat(idConversa);
      await carregarConversas(usuario.id);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setPerguntaRespondida(true);
    } finally {
      setPerguntaRespondida(true);
    }
  }

  async function carregarDocumentos(idusuario: number) {
    try {
      const lista = await listarDocumentos(idusuario);
      setDocumentos(lista);
    } catch (error) {
      console.error("Erro ao carregar documentos", error);
    }
  }

  async function carregarConversas(idusuario: number) {
    try {
      const lista = await listarConversas(idusuario);
      setConversas(lista);
    } catch (error) {
      console.error("Erro ao carregar conversas", error);
    }
  }

  async function handleNovaConversa() {
    if (!usuario) return;
    try {
      await criarConversa(usuario.id);
      await carregarConversas(usuario.id);
    } catch (error) {
      console.error("Erro ao criar conversa", error);
    }
  }

  async function handleDeletarConversa(idconversa: number) {
    if (!usuario) return;
    try {
      await deletarConversa(idconversa);
      await carregarConversas(usuario.id);
      if (conversaAtiva === idconversa) setChat([]);
    } catch (error) {
      console.error("Erro ao deletar conversa", error);
    }
  }

  function adicionarDocumento(iddocumento: number) {
    const doc = documentos.find((d) => d.iddocumento === iddocumento);
    if (!doc) return;
    if (documentosSelecionados.some((d) => d.iddocumento === iddocumento)) return;
    setDocumentosSelecionados((prev) => [...prev, doc]);
  }

  function removerDocumento(iddocumento: number) {
    setDocumentosSelecionados((prev) => prev.filter((d) => d.iddocumento !== iddocumento));
  }

  function handleLogout() {
    localStorage.removeItem("usuario");
    navigate("/login");
  }

  return (
    <div className="h-screen flex bg-white text-black dark:bg-neutral-950 dark:text-white">
      {/* SIDEBAR */}
      <aside className="w-60 flex flex-col border-r bg-neutral-100 border-neutral-300 dark:bg-neutral-900 dark:border-neutral-800">
        <div className="p-4 border-b border-neutral-300 dark:border-neutral-800 space-y-2">
          <div className="font-semibold">Olá, {usuario?.nome || "Usuário"}</div>

          <button
            onClick={handleNovaConversa}
            className="w-full bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 p-2 rounded-lg transition"
          >
            + Nova conversa
          </button>

          <Link
            to="/files"
            className="block text-center bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 p-2 rounded-lg transition text-sm"
          >
            Configurações
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {conversas.length === 0 && <div className="text-sm text-neutral-500">Nenhuma conversa ainda</div>}
          {conversas.map((c) => (
            <div
              key={c.idconversa}
              className="relative group p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer flex justify-between items-center"
              onClick={() => {
                setConversaAtiva(c.idconversa);
                carregarChat(c.idconversa);
              }}
            >
              <span>{c.titulo}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletarConversa(c.idconversa);
                }}
                className="text-red-500 text-sm hover:underline hidden group-hover:block"
              >
                Encerrar
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-neutral-300 dark:border-neutral-800">
          <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">
            Sair
          </button>
        </div>
      </aside>

      {/* CHAT CENTRAL */}
      <main className="flex-1 flex flex-col">
        <div className="p-4 border-b border-neutral-300 dark:border-neutral-800 font-semibold flex items-center justify-between">
          <span>Chat</span>
          {conversaAtiva !== null && (
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {conversas.find((c) => c.idconversa === conversaAtiva)?.titulo || "Conversa"}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
          {chat.length === 0 && <div className="text-sm text-neutral-500">Nenhuma mensagem ainda</div>}

{chat.map((item) => (
  <div
    key={`${item.tipo}-${item.id}`} // <--- aqui a mudança
    className={`p-4 rounded-xl max-w-xl ${
      item.tipo === "usuario"
        ? "bg-green-600 text-white self-end"
        : "bg-gray-300 dark:bg-gray-700 text-black self-start"
    }`}
  >
    {item.conteudo}
  </div>
))}
        </div>

        <div className="p-4 border-t border-neutral-300 dark:border-neutral-800">
          <div className="bg-neutral-200 dark:bg-neutral-800 rounded-xl p-3 flex items-center">
            <input
              className="flex-1 bg-transparent outline-none"
              placeholder="Digite sua mensagem..."
              value={mensagemInput}
              onChange={(e) => setMensagemInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && perguntaRespondida) {
                  e.preventDefault();
                  handleEnviarMensagem();
                }
              }}
            />
            <button
              onClick={handleEnviarMensagem}
              disabled={!perguntaRespondida}
              className={`ml-3 px-4 py-2 rounded-lg transition text-white ${
                perguntaRespondida ? "bg-green-600 hover:bg-green-500" : "bg-green-400 cursor-not-allowed"
              }`}
            >
              Enviar
            </button>
          </div>
        </div>
      </main>

      {/* PAINEL DIREITO */}
      <aside className="w-72 flex flex-col border-l bg-neutral-100 border-neutral-300 dark:bg-neutral-900 dark:border-neutral-800">
        <div className="p-4 border-b border-neutral-300 dark:border-neutral-800">
          <label className="text-sm text-neutral-500 dark:text-neutral-400 block">Arquivos para pesquisa</label>
        </div>

        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {documentosSelecionados.length === 0 && <div className="text-sm text-neutral-500">Nenhum arquivo selecionado</div>}
          {documentosSelecionados.map((doc) => (
            <div key={doc.iddocumento} className="bg-neutral-200 dark:bg-neutral-800 p-3 rounded-lg flex justify-between items-center">
              <span>{doc.titulo}</span>
              <button onClick={() => removerDocumento(doc.iddocumento)} className="text-red-500 text-sm hover:underline">
                remover
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-neutral-300 dark:border-neutral-800">
          <label className="text-sm text-neutral-500 dark:text-neutral-400 block mb-2">Adicionar arquivo</label>
          <select className="w-full bg-neutral-200 dark:bg-neutral-800 p-2 rounded-lg outline-none" onChange={(e) => adicionarDocumento(Number(e.target.value))}>
            <option value="">Selecione...</option>
            {documentos.map((doc) => (
              <option key={doc.iddocumento} value={doc.iddocumento}>
                {doc.titulo}
              </option>
            ))}
          </select>
        </div>
      </aside>
    </div>
  );
}
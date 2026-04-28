import * as mensagemRepository from "../repositories/mensagemRepository.js";
import * as conversaService from "./conversaService.js";
import * as mensagemProcessadaService from "./mensagemProcessadaService.js";

export async function enviarMensagem(mensagem) {
  const { conteudo, idconversa, documentos_prioritarios } = mensagem;

  if (!conteudo || conteudo.trim() === "") {
    throw new Error("Conteúdo da mensagem é obrigatório");
  }

  if (!idconversa) {
    throw new Error("Conversa é obrigatória");
  }

  const idmensagem = await mensagemRepository.enviarMensagem({
    conteudo,
    idconversa
  });

  await conversaService.atualizarTituloSeNecessario(idconversa, conteudo);

  const idmensagemProcessada = await mensagemProcessadaService.cadastrarMensagemProcessada({
    conteudo,
    idmensagem
  });

  return {
    idmensagem,
    idmensagemProcessada,
    conteudo,
    idconversa,
    data: new Date().toISOString()
  };
}

export async function listarMensagens(idconversa) {

  if (!idconversa) {
    throw new Error("Conversa é obrigatória");
  }

  const mensagens =
    await mensagemRepository.listarMensagensPorConversa(idconversa);

  return mensagens;
}
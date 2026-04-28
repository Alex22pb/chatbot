import * as mensagemService from "../services/mensagemService.js";

export async function enviar(req, res) {

  const { conteudo, idconversa } = req.body;

  if (!conteudo || !idconversa) {
    return res.status(400).json({ erro: "Conteúdo e conversa são obrigatórios" });
  }

  try {

    const mensagem = await mensagemService.enviarMensagem({
      conteudo,
      idconversa,
      documentos_prioritarios
    });

    res.status(201).json({
      message: "Mensagem enviada com sucesso",
      mensagem
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({ erro: "Erro ao enviar mensagem" });

  }

}


export async function listar(req, res) {

  const { idconversa } = req.params;

  try {

    const mensagens =
      await mensagemService.listarMensagens(idconversa);

    res.json(mensagens);

  } catch (error) {

    console.error(error);

    res.status(500).json({ erro: "Erro ao listar mensagens" });

  }

}
export interface MensagemData {
  conteudo: string;
  idconversa: number;
  documentos_prioritarios?: number[];
}

export interface MensagemResponse {
  idmensagem: number;
  conteudo: string;
  data: string;
  idconversa: number;
}

export async function enviarMensagem(data: MensagemData): Promise<{ message: string; mensagem: MensagemResponse }> {

  const response = await fetch("http://localhost:3000/mensagens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.erro || "Erro ao enviar mensagem");
  }

  return responseData;
}

export async function listarMensagens(idconversa: number): Promise<MensagemResponse[]> {

  const response = await fetch(`http://localhost:3000/mensagens/${idconversa}`);

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.erro || "Erro ao listar mensagens");
  }

  return responseData;
}
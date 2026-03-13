const CONFIG = {
  SHEET_NAME: "ESTOQUE",
  API_BASE:"https://graph.facebook.com/v22.0/",
  TOKEN: "EAARg3PvrGsMBQ5QYuV63GGBKOXZAKoSZCgElm9g6ZAna8qZBSsRyIDZATqsBg2mE9SMeLVUo0vKAZCLKjaNdsgppv6xImkb12vQg8wXZARZBBJ40Hsf4u7XqLZAKWjsgG3FTJcWIZBZAx3UXjuhsh2gYYKoapyQ8mFs3wHhWoZABK2DSlhMo1Gq0mC6nNohQAFBXYp1ZAeDVIRDnjEKxInMwGEmzsig8ggnPWDRmVj1ShUwZAKrS6dOTYKUr5Jj1ZAvZCJ8KQgV1cKMjwpErNree8rrgzv0PsQZDZD",
  PHONE_NUMBER_ID: "1102770612916513",
  ENDPOINT_MESSAGES: "/messages",
  RECIPIENTS: [
    "553198855556",
    "553173521069",
    "553199903358",
    "553184360204",
    "553183492322"
  ],
  TEMPLATE_NAME: "alerta_estoque",
  // o template é criado fora do codigo no painel da META. Aq é so o conteudo do template
  TEMPLATE_LANG: "pt_BR",
  REENVIO_HORAS: 48,
};

function verificarItensAbaixoDoMinimo() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ESTOQUE");
  const dados = aba.getRange(2,1,aba.getLastRow(),aba.getLastColumn()).getValues();

  const cabecalho = dados[0];

  const colCodigo = cabecalho.indexOf("Código");
  const colNome = cabecalho.indexOf("Nome Técnico");
  const colQtd = cabecalho.indexOf("Qtd");
  const colMin = cabecalho.indexOf("Mín");
  const colAlerta = cabecalho.indexOf("ALRT_ENVD");
  const colData = cabecalho.indexOf("DATA_U_AL");

  const agora = new Date();
  const itensEmAlerta = [];

  for (let i = 1; i < dados.length; i++) {
    const linha = dados[i];

    const codigo = linha[colCodigo];
    const nome = linha[colNome];
    const qtd = Number(linha[colQtd]) || 0;
    const min = Number(linha[colMin]);
    const alertaEnviado = String(linha[colAlerta] || "").trim().toUpperCase();
      // null
      // undefined
      // ""
      // 0
      // false
      // Esses sao os valores "falsy" em js. linha[colAlerta] || "" diz basicamente que se o valor for falsy ent ele é "". string() garante que o valor vire string. .trim tira os espaços. toUpperCase = tudo em maiusculo.
    const dataUltimoAlerta = linha[colData] instanceof Date ? linha[colData] : null;
    // o valor é linha[colData] - linha [colData] é uma data? valor se true : valor se false

    if(qtd < min){
      const deveReenviar = precisaReenviar(dataUltimoAlerta,CONFIG.REENVIO_HORAS);
      // se nao tivesse padronizado o texto ali em cima o SIM abaixo poderia quebrar.
      if(alertaEnviado !== "SIM" || deveReenviar) {
        itensEmAlerta.push({
          linha: i + 2,
          codigo,
          nome,
          qtd,
          min
          // quando o nome da propriedade é igual o nome da variavel que da o valor dela 
          // os js dxa vc fazer assim e ele entende diretamente como, ex : min : min
        });
      }
    } else {
      aba.getRange(i + 2, colAlerta + 1).setValue("");
      aba.getRange(i + 2, colData + 1).setValue("");
    }
  }

  if(itensEmAlerta.length === 0){
    Logger.log("Nenhum item novo abaixo do minimo")
    return;
  }

  const mensagem = montarMensagemAlerta(itensEmAlerta);

  Logger.log(mensagem);

  CONFIG.RECIPIENTS.forEach(numero => {
    enviarWhatsApp(numero,mensagem);
  });

  for (const item of itensEmAlerta){
    aba.getRange(item.linha, colAlerta + 1).setValue("SIM");
    aba.getRange(item.linha, colData + 1).setValue(agora);
  }
}

  function precisaReenviar(dataUltimoAlerta, intervaloTempo){
    if(!dataUltimoAlerta) return true;

    const agora = new Date();
    // date é uma classe/objeto nativo de JS que representa tempo
    // new = crie uma nova instancia/parametro pra esse objeto. Isso retorna a data atual do sistema
    const difMs = agora - dataUltimoAlerta;
    const difHrs = difMs/(1000 * 60 * 60);

    return difHrs >= intervaloTempo;
  }
  // Funciona declarar a função depois no codigo pq functions sao hoisted em js. Ou seja : elas sao registradas antes de tudo. fica mais ou menos assim. -declaração das funcoes sao registradas -
  // começa a executar verificarItensAbaixoDoMinimo() - > chama precisaReenviar() -> prencisaReenviar() e verificarItensAbaixoDoMinimo() -> verificarItensAbaixoDoMinimo () continua.. Nao da pau pq precisaReenviar() ja tava declarada. 

//   function montarMensagemAlerta(itens) {
//     // lembrando que em JS tag function vao para cima do codigo
//     return itens.map(item => {
//       const nome = String(item.nome || "")
//         .replace(/\n/g, " ")
//         .replace(/\t/g, " ")
//         .replace(/ {2,}/g, " ")
//         .trim();

//       const qtd = String(item.qtd || "").trim();
//       const min = String(item.min || "").trim();

//       return `🔸 ${nome} Qtd: ${qtd} | Min: ${min}`;
//     })
//     .join(" \\ ");
// }
  function montarMensagemAlerta(itens) {
  const LIMITE_PARAMETRO = 900; // margem de segurança abaixo dos 1024 do template
  const partes = [];
  let tamanhoAtual = 0;
  let itensIncluidos = 0;

  for (const item of itens) {
    const nome = String(item.nome || "")
      .replace(/\n/g, " ")
      .replace(/\t/g, " ")
      .replace(/ {2,}/g, " ")
      .trim();

    const qtd = String(item.qtd ?? "").trim() || "-";
    const min = String(item.min ?? "").trim() || "-";

    const trecho = `🔸 *${nome}* _Qtd: ${qtd} | Min: ${min}_ <----->`;
    const separador = partes.length > 0 ? " // " : "";
    const novoTamanho = tamanhoAtual + separador.length + trecho.length;

    if (novoTamanho > LIMITE_PARAMETRO) {
      break;
    }

    partes.push(trecho);
    tamanhoAtual = novoTamanho;
    itensIncluidos++;
  }

  const restantes = itens.length - itensIncluidos;

  if (restantes > 0) {
    const avisoRestantes = ` \\ +${restantes} itens`;
    if (tamanhoAtual + avisoRestantes.length <= LIMITE_PARAMETRO) {
      partes.push(`+${restantes} itens`);
    }
  }

  return partes.join(" \\ ");
}

  function enviarWhatsApp(destinatario,mensagem) {
    const url = `${CONFIG.API_BASE}${CONFIG.PHONE_NUMBER_ID}${CONFIG.ENDPOINT_MESSAGES}`;

    // payload = o que enviar
    // payload é objeto json
    const playload = { 
      messaging_product: "whatsapp",
      // estou usando o produto whatsapp
      recipient_type: "individual",
      to: destinatario,
      // numero que vai receber a mensagem
      type: "template",
      // tipo de msg que eu to enviando (no meu caso template aprovado)
      // o objeto abaixo descreve qual template usar e quais variaveis preencher
      template: {
        name: CONFIG.TEMPLATE_NAME,
        language : {
          code : CONFIG.TEMPLATE_LANG,
        },
        components: [
        {
          type: "body",
          parameters: [
            {
            type: "text",
            text: mensagem
            }
          ]
        }
      ]
    }
  };
  // componentes é array pq um template pode ter varios components com parametros (variaveis) ao mesmo tempo. Header, body, button, foot.
  // parametres tbm é um array [] pq pode ter varios parametros. Nesse caso tem so um {}.
  // options = como enviar
  const options = {
    method: "post",
    // vou enviar DADOS para a API
    contentType: "application/json",
    // headers = quem está enviando/qual formato/autorização
    headers: {
      Authorization: `Bearer ${CONFIG.TOKEN}`
      // bearer é um tipo de autenticação usado em API's, basicamente : quem tiver esse token pode usar.
    },
    payload: JSON.stringify(playload),
    muteHttpExceptions: true
    // para parar o script em caso de erro
  }
    const respHTTP = UrlFetchApp.fetch(url,options);
    const code = respHTTP.getResponseCode();
    const body = respHTTP.getContentText();

    Logger.log ("Status" + code);
    Logger.log("Resposta" + body);

  }


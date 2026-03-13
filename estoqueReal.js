const respostas = {
  direcao : null,
  responsavel : null,
  att: null,
  tipoMov: null,
  quantidade: null,
  momento: null,
  nomeDaPeca: null,
  tipoEntrada: null,
  tipoSaida: null,
  EEXPparaOnde: null,
  SEXPcomquem: null,
  SESTTECquem: null,
  SESTTEConde: null,
  SESTTECvolta: null,
  nfEntregue: null,
};

const baralho = {
  0: (respostas) => {
    if (respostas.direcao === "att") return 1;
    else return 2;
  },
  1: (respostas) => {
    return 8;
  },
  2: (respostas) => {
    if (respostas.tipoMov === "ENTRADAEST") return 3;
    else if (respostas.tipoMov === "SAIDAEST") return 4;
    else if (respostas.tipoMov === "ENTRADAEXP") return 5;
    else if (respostas.tipoMov === "SAIDAEXP") return 6;
  },
  3: (respostas) => {
    if (respostas.tipoEntrada === "TECompra") return 7;
    else if (respostas.tipoEntrada === "TEDevolucaoTec") return 8;
    else if (respostas.tipoEntrada === "TEDevolucaoCon") return 8;
    else if (respostas.tipoEntrada === "TEGuardar") return 8;
  },
  4: (respostas) => {
    if(respostas.tipoSaida === "TStecnicos(manutenção)") return 9;
    else if (respostas.tipoSaida === "TSvendaAvulsa") return 8;
    else if (respostas.tipoSaida === "TScaixaDeExp") return 5;
  },
  5: (respostas) => {
    return 8;
  },
  6: (respostas) =>{
    return 8;
  },
  7: (respostas) =>{
    return 8;
  },
  9: (respostas) =>{
    return 8;
  },
};


let cardAtual = 0;



const cards = document.querySelectorAll(".card");
const cardResp = document.querySelector(".card_responsavel");

function getCardAtual() {
  return cards[cardAtual];
}

function cardValido(cardEL) {
  const campos = cardEL.querySelectorAll("input, select, textarea");

  if(campos.length === 0) return true;

  for(const campo of campos){

    if(campo.disabled) continue;

    const required = campo.required;

    if(campo.type === "radio" && required){
      const grupo = cardEL.querySelectorAll(`input[type="radio"][name="${CSS.escape(campo.name)}"]`);
      // css.escape serve pra prevenir nomes que dao pau no css selector
      const algumMarcado = Array.from(grupo).some(r => r.checked);
      if(!algumMarcado) return false;
      continue;
      // o continue puxa o for de volta para o proximo item do grupo. no caso o proximo campo do campos
    };

    if(campo.type === "checkbox" && required){
      if(!campo.checked) return false;
      continue;
    };

    if(campo.tagName === "SELECT" && required){
      if (!campo.value || campo.value === "null") return false;
      continue;
    }

    if(required) {
      const val = (campo.value ?? "").trim();
      // trim tira espaços e ?? faz valores como null e etc virarem ""
      if (!val) return false;
    }
  }
  return true;
}
// async é funcao asincrona. Ela basicamete vai executando enquanto as o codigo executa em paralelo. Tipo o codigo nao trava esperando ela executar,
// basicamente. O codigo ve a função, encontra um await, fala : dps eu volto aqui. E continua executando o resto ate a promise do await ser fullfiled 
async function carregarPeças(){
  const resHTTP = await fetch("https://script.google.com/macros/s/AKfycbyzQViURpfR4qG8LROXM1B166wxYfwellLbpMEz2M3HfpCBiPySismfH_ViC889cIQlyQ/exec");
  // await faz a função esperar aquilo rodar para continuar executando
  // basicamente esperar a promise ser respondida. Fetch retorna essa promise que espera a resposta http que vai chegar eventualmente.
  // quando chegar a promise fica fullfiled e nao pending. Ai resHTTP = resposta
  // pending
  // fulfilled
  // rejected
  // estados possiveis da promise
  const pecas = await resHTTP.json();
  // json() converte o texto para array de objetos em js normal.

  const select = document.getElementById("nomePeca");

  pecas.forEach(p => {
    const option = document.createElement("option");

    option.value = p.codigo;
    option.textContent = `${p.nome}`;

    select.appendChild(option);

  });

  new TomSelect("#nomePeca", {
  create: false,
  placeholder: "Digite a peça..",
  sortField: {
    field: "text",
    direction: "asc"
  }
});

}

carregarPeças();


const btnProximo = document.querySelector("#buttonNext");

function checkarBotaoProximo() {
  const cardEl = getCardAtual();
  btnProximo.disable = !cardValido(cardEl);
}

function mostrar(i){
  cards.forEach(c => c.classList.add("oculto"));
  cards[i].classList.remove("oculto");
  checkarBotaoProximo();
}

mostrar(cardAtual);

function proximoCard(){
  const rumo = baralho[cardAtual]; // quando vc bota [] ele pega o valor da variavel ao inves de tentar achar o elemetno 
  //card atual como propriedade dentro do objeto.
  if(!rumo) return;

  cardAtual = rumo(respostas);
  if(cardAtual === 8) btnProximo.classList.add("oculto");
  mostrar(cardAtual);
}

btnProximo.addEventListener("click", () =>
{
  let contador = 0;
  const cardEl = getCardAtual();
  if(!cardValido(cardEl)){
    cardEl.classList.add("shake");
    setTimeout (() => cardEl.classList.remove("shake"), 250);
    contador++;
  }
  if(!cardValido(cardResp)){
    cardResp.classList.add("shake");
    setTimeout(() => cardResp.classList.remove("shake"), 250);
    contador++;
  }else cardResp.classList.add("oculto");

  if(contador > 0) return;

  proximoCard();
});

document.querySelectorAll('input[name="Mov_att"]').forEach(radio => {
  radio.addEventListener("change", (event) =>
  {
    respostas.direcao = event.target.value;
    console.log(`A direção eh: ${respostas.direcao}`);
  });
});

document.querySelector("#responsavel").addEventListener("change", (event) =>
  {
    respostas.responsavel = event.target.value;
    console.log(`O responsavel eh: ${respostas.responsavel}`);
  }
);

document.getElementById("att").addEventListener("change", (event) =>
{
  respostas.att = event.target.value;
  console.log(`A att feita foi: ${respostas.att}`);
});

document.querySelectorAll('input[name="momento"]').forEach(radio =>{
  radio.addEventListener("change", (event) =>
  {
    respostas.momento = event.target.value;
    console.log(`O momento eh : ${respostas.momento}`);
  });
});

document.getElementById("nomePeca").addEventListener("change", (event) =>
{
  respostas.nomeDaPeça = event.target.value;
  console.log(`A peça eh: ${respostas.nomeDaPeça} `);
});

document.getElementById("quantidade").addEventListener("change", (event) =>
{
  respostas.quantidade = event.target.value;
  console.log(`Sao ${respostas.quantidade} ${respostas.nomeDaPeça}`);
});

document.querySelectorAll('input[name="Tdeentrada"]').forEach(radio =>{
  radio.addEventListener("change", (event) =>
  {
    respostas.tipoEntrada = event.target.value;
    console.log(`O tipo de entrada eh: ${respostas.tipoEntrada}`);
  });
});

document.querySelectorAll('input[name="tipo"]').forEach(radio =>{
  radio.addEventListener("change", (event) =>
  {
    respostas.tipoMov = event.target.value;
    console.log(`O tipo eh: ${respostas.tipoMov}`);
  });
});

document.querySelectorAll(`input[name="Tdesaida"]`).forEach(radio =>{
  radio.addEventListener("change", (event) => 
  {
    respostas.tipoSaida = event.target.value;
    console.log(`O tipo de saida eh: ${respostas.tipoSaida}`);
  });
});

document.getElementById("Eexp").addEventListener("change", (event) =>
{
  respostas.EXPparaOnde = event.target.value;
  console.log(`Vai da exp para ${respostas.EXPparaOnde}`);
});

document.getElementById("Sexp").addEventListener("change", (event) =>
{
  respostas.SEXPcomquem = event.target.value;
  console.log(`Esta saindo da exp com : ${respostas.SEXPcomquem}`);
});

document.getElementById("maos").addEventListener("change", (event) =>
{
  respostas.SESTTECquem = event.target.value;
  console.log(`A peça esta sainda naos maos de ${respostas.SESTTECquem}`);
});

document.querySelectorAll('input[name="volta"]').forEach(radio =>{
  radio.addEventListener("change", (event) =>
  {
    respostas.SESTTECvolta = event.target.value;
    console.log(`A peça ${respostas.SESTTECvolta} volta pro estoque`);
  });
});

document.getElementById("onde").addEventListener("change", (event) =>
{
  respostas.SESTTEConde = event.target.value;
  console.log(`A peça esta indo com o ${respostas.SESTTECquem} para ${respostas.SESTTEConde}`);
});

const nf = document.getElementById("nf");

nf.addEventListener("change", e =>
{
  if(e.target.checked){
    respostas.nfEntregue = "Sim";
  }else{
    respostas.nfEntregue = null;
  }
  console.log("Nf foi entregue" , respostas.nfEntregue);
}
);

document.getElementById("btnEnviar").addEventListener("click", async () => {
  await enviarRespostas();
});

async function enviarRespostas () {
  const url = "https://script.google.com/macros/s/AKfycbyzQViURpfR4qG8LROXM1B166wxYfwellLbpMEz2M3HfpCBiPySismfH_ViC889cIQlyQ/exec"

  const payload = {
    ...respostas,
  };

  try{
    const resHTTP = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const resultado = await resHTTP.json();

    if (resultado.ok) {
      alert("Respostas enviadas com sucesso");
      console.log(resultado);
    } else {
      alert("Erro ao salvar na planilha");
      console.error(resultado);
    }
  } catch (erro) {
    alert("Falha ao enviar");
    console.error(erro);
  }
}























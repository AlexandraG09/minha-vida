const ecraBoasVindas = document.querySelector(
    "#ecra-boas-vindas"
);

const aplicacao = document.querySelector(
    "#aplicacao"
);

const botaoComecar = document.querySelector(
    "#botao-comecar"
);

const botoesNavegacao = document.querySelectorAll(
    "[data-destino]"
);

const paginas = document.querySelectorAll(
    "[data-pagina]"
);

const tituloPagina = document.querySelector(
    "#titulo-pagina"
);

const estadoDados = document.querySelector(
    "#estado-dados"
);

botaoComecar.addEventListener(
    "click",
    function () {
        ecraBoasVindas.classList.add("oculto");
        aplicacao.classList.remove("oculto");
    }
);

botoesNavegacao.forEach(
    function (botao) {
        botao.addEventListener(
            "click",
            function () {
                const destino =
                    botao.dataset.destino;

                paginas.forEach(
                    function (pagina) {
                        pagina.classList.toggle(
                            "ativa",
                            pagina.dataset.pagina ===
                                destino
                        );
                    }
                );

                botoesNavegacao.forEach(
                    function (outroBotao) {
                        outroBotao.classList.toggle(
                            "ativo",
                            outroBotao === botao
                        );
                    }
                );

                const nomePagina =
                    botao.querySelector(
                        "small"
                    )?.textContent;

                if (nomePagina) {
                    tituloPagina.textContent =
                        nomePagina;
                }
            }
        );
    }
);

async function iniciarArmazenamento() {
    try {
        await window.MinhaVidaDB
            .abrirBaseDados();

        estadoDados.textContent =
            "Dados guardados apenas neste dispositivo.";

        estadoDados.classList.add(
            "sucesso"
        );
    } catch (erro) {
        console.error(erro);

        estadoDados.textContent =
            "Não foi possível preparar o armazenamento local.";

        estadoDados.classList.add(
            "erro"
        );
    }
}

iniciarArmazenamento();

function registarServiceWorker() {
    const estaEmLocalhost =
        window.location.hostname ===
            "localhost" ||
        window.location.hostname ===
            "127.0.0.1";

    const ligacaoSegura =
        window.location.protocol ===
            "https:" ||
        estaEmLocalhost;

    if (
        !("serviceWorker" in navigator) ||
        !ligacaoSegura
    ) {
        return;
    }

    navigator.serviceWorker
        .register("./service-worker.js")
        .then(function () {
            console.log(
                "Funcionamento offline preparado."
            );
        })
        .catch(function (erro) {
            console.error(
                "Erro ao preparar funcionamento offline:",
                erro
            );
        });
}

window.addEventListener(
    "load",
    registarServiceWorker
);
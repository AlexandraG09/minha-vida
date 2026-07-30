(function () {
    "use strict";

    let elementos = {};

    function iniciarAplicacao() {
        elementos = {
            aplicacao: document.querySelector("#aplicacao"),
            botoesNavegacao: document.querySelectorAll("[data-destino]"),
            paginas: document.querySelectorAll("[data-pagina]"),
            atalhos: document.querySelectorAll("[data-ir-para]"),
            dataAtual: document.querySelector("#data-atual")
        };

        atualizarDataAtual();
        configurarNavegacao();
        iniciarArmazenamento();
    }

    function atualizarDataAtual() {
        if (!elementos.dataAtual) {
            return;
        }

        const texto = new Intl.DateTimeFormat("pt-PT", {
            weekday: "long",
            day: "numeric",
            month: "long"
        }).format(new Date());

        elementos.dataAtual.textContent = texto;
    }

    function configurarNavegacao() {
        elementos.botoesNavegacao.forEach(function (botao) {
            botao.addEventListener("click", function () {
                mostrarPagina(botao.dataset.destino);
            });
        });

        elementos.atalhos.forEach(function (atalho) {
            atalho.addEventListener("click", function () {
                const destino = atalho.dataset.irPara;
                const secaoCasa = atalho.dataset.casaSecao || null;
                mostrarPagina(destino, secaoCasa);
            });
        });
    }

    function mostrarPagina(destino, secaoCasa = null) {
        elementos.paginas.forEach(function (pagina) {
            pagina.classList.toggle("ativa", pagina.dataset.pagina === destino);
        });

        elementos.botoesNavegacao.forEach(function (botao) {
            botao.classList.toggle("ativo", botao.dataset.destino === destino);
        });

        if (destino === "casa" && secaoCasa) {
            mostrarSecaoCasa(secaoCasa);
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function mostrarSecaoCasa(secao) {
        const botao = document.querySelector(`[data-secao-casa="${secao}"]`);

        if (botao) {
            botao.click();
        }
    }

    async function iniciarArmazenamento() {
        try {
            await window.MinhaVidaDB.abrirBaseDados();
        } catch (erro) {
            console.error("Não foi possível preparar o armazenamento local:", erro);
            alert("Não foi possível preparar o armazenamento local neste navegador.");
        }
    }

    function registarServiceWorker() {
        const estaEmLocalhost =
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1";

        const ligacaoSegura = window.location.protocol === "https:" || estaEmLocalhost;

        if (!("serviceWorker" in navigator) || !ligacaoSegura) {
            return;
        }

        navigator.serviceWorker.register("./service-worker.js").catch(function (erro) {
            console.error("Erro ao preparar funcionamento offline:", erro);
        });
    }

    window.MinhaVidaApp = Object.freeze({
        mostrarPagina,
        mostrarSecaoCasa
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciarAplicacao);
    } else {
        iniciarAplicacao();
    }

    window.addEventListener("load", registarServiceWorker);
})();

(function () {
    "use strict";

    const formatadorData = new Intl.DateTimeFormat("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    let elementos = {};
    let notasGuardadas = [];

    function iniciarNotas() {
        elementos = {
            botaoNovo: document.querySelector("#botao-nova-nota"),
            botaoVazio: document.querySelector("#botao-primeira-nota"),
            modal: document.querySelector("#modal-nota"),
            fecharModal: document.querySelector("#fechar-modal-nota"),
            cancelar: document.querySelector("#cancelar-nota"),
            apagar: document.querySelector("#apagar-nota"),
            formulario: document.querySelector("#formulario-nota"),
            tituloModal: document.querySelector("#titulo-modal-nota"),
            campoId: document.querySelector("#nota-id"),
            campoTitulo: document.querySelector("#nota-titulo"),
            campoConteudo: document.querySelector("#nota-conteudo"),
            pesquisa: document.querySelector("#notas-pesquisa"),
            lista: document.querySelector("#lista-notas"),
            estadoVazio: document.querySelector("#notas-vazio"),
            semResultados: document.querySelector("#notas-sem-resultados")
        };

        if (!elementos.formulario || !elementos.botaoNovo) {
            return;
        }

        elementos.botaoNovo.addEventListener("click", abrirNovaNota);
        elementos.botaoVazio?.addEventListener("click", abrirNovaNota);
        elementos.fecharModal.addEventListener("click", fecharModal);
        elementos.cancelar.addEventListener("click", fecharModal);
        elementos.apagar.addEventListener("click", apagarNotaAtual);
        elementos.formulario.addEventListener("submit", guardarNota);
        elementos.pesquisa.addEventListener("input", mostrarNotasFiltradas);
        elementos.lista.addEventListener("click", function (evento) {
            const botao = evento.target.closest("button[data-nota-id]");
            if (botao) {
                abrirEdicao(botao.dataset.notaId);
            }
        });
        elementos.modal.addEventListener("click", function (evento) {
            if (evento.target === elementos.modal) {
                fecharModal();
            }
        });

        document.addEventListener("keydown", function (evento) {
            if (evento.key === "Escape" && !elementos.modal.classList.contains("oculto")) {
                fecharModal();
            }
        });

        atualizarNotas();
    }

    function abrirNovaNota() {
        elementos.formulario.reset();
        elementos.campoId.value = "";
        elementos.tituloModal.textContent = "Nova nota";
        elementos.apagar.classList.add("oculto");
        mostrarModal();
        setTimeout(function () {
            elementos.campoTitulo.focus();
        }, 100);
    }

    async function abrirEdicao(id) {
        try {
            const nota = await window.MinhaVidaDB.obter(
                window.MinhaVidaDB.LOJAS.notas,
                id
            );

            if (!nota) {
                return;
            }

            elementos.campoId.value = nota.id;
            elementos.campoTitulo.value = nota.titulo || "";
            elementos.campoConteudo.value = nota.conteudo || "";
            elementos.tituloModal.textContent = "Editar nota";
            elementos.apagar.classList.remove("oculto");
            mostrarModal();
        } catch (erro) {
            console.error(erro);
            alert("Não foi possível abrir a nota.");
        }
    }

    function mostrarModal() {
        elementos.modal.classList.remove("oculto");
        document.body.classList.add("modal-aberto");
    }

    function fecharModal() {
        elementos.modal.classList.add("oculto");
        document.body.classList.remove("modal-aberto");
        elementos.formulario.reset();
        elementos.campoId.value = "";
        elementos.apagar.classList.add("oculto");
    }

    async function guardarNota(evento) {
        evento.preventDefault();

        const titulo = elementos.campoTitulo.value.trim();
        const conteudo = elementos.campoConteudo.value.trim();

        if (!titulo) {
            alert("Escreve um título para a nota.");
            elementos.campoTitulo.focus();
            return;
        }

        const idExistente = elementos.campoId.value;
        let notaExistente = null;

        if (idExistente) {
            notaExistente = await window.MinhaVidaDB.obter(
                window.MinhaVidaDB.LOJAS.notas,
                idExistente
            );
        }

        const agora = new Date().toISOString();
        const nota = {
            id: idExistente || window.MinhaVidaDB.criarId(),
            titulo,
            conteudo,
            dataCriacao: notaExistente?.dataCriacao || agora,
            dataAtualizacao: agora
        };

        const botaoGuardar = elementos.formulario.querySelector('button[type="submit"]');
        botaoGuardar.disabled = true;
        botaoGuardar.textContent = "A guardar…";

        try {
            await window.MinhaVidaDB.guardar(
                window.MinhaVidaDB.LOJAS.notas,
                nota
            );
            fecharModal();
            await atualizarNotas();
        } catch (erro) {
            console.error(erro);
            alert("Não foi possível guardar a nota.");
        } finally {
            botaoGuardar.disabled = false;
            botaoGuardar.textContent = "Guardar";
        }
    }

    async function apagarNotaAtual() {
        const id = elementos.campoId.value;
        if (!id || !confirm("Queres apagar esta nota?")) {
            return;
        }

        try {
            await window.MinhaVidaDB.remover(
                window.MinhaVidaDB.LOJAS.notas,
                id
            );
            fecharModal();
            await atualizarNotas();
        } catch (erro) {
            console.error(erro);
            alert("Não foi possível apagar a nota.");
        }
    }

    async function atualizarNotas() {
        try {
            notasGuardadas = await window.MinhaVidaDB.listar(
                window.MinhaVidaDB.LOJAS.notas
            );

            notasGuardadas.sort(function (primeira, segunda) {
                return (segunda.dataAtualizacao || segunda.dataCriacao || "").localeCompare(
                    primeira.dataAtualizacao || primeira.dataCriacao || ""
                );
            });

            mostrarNotasFiltradas();
        } catch (erro) {
            console.error(erro);
            elementos.lista.textContent = "Não foi possível carregar as notas.";
        }
    }

    function mostrarNotasFiltradas() {
        const pesquisa = normalizarTexto(elementos.pesquisa.value);
        const filtradas = notasGuardadas.filter(function (nota) {
            return (
                !pesquisa ||
                normalizarTexto(nota.titulo).includes(pesquisa) ||
                normalizarTexto(nota.conteudo).includes(pesquisa)
            );
        });

        elementos.lista.replaceChildren();
        const existemNotas = notasGuardadas.length > 0;
        const existemResultados = filtradas.length > 0;

        elementos.estadoVazio.classList.toggle("oculto", existemNotas);
        elementos.semResultados.classList.toggle(
            "oculto",
            !existemNotas || existemResultados
        );
        elementos.lista.classList.toggle("oculto", !existemResultados);

        filtradas.forEach(function (nota) {
            elementos.lista.appendChild(criarCartaoNota(nota));
        });
    }

    function criarCartaoNota(nota) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "cartao-nota";
        botao.dataset.notaId = nota.id;

        const titulo = document.createElement("strong");
        titulo.textContent = nota.titulo;

        const previa = document.createElement("p");
        previa.textContent = nota.conteudo || "Nota sem conteúdo";

        const data = document.createElement("small");
        data.textContent = formatadorData.format(
            new Date(nota.dataAtualizacao || nota.dataCriacao)
        );

        botao.append(titulo, previa, data);
        return botao;
    }

    function normalizarTexto(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    window.MinhaVidaNotas = Object.freeze({ atualizar: atualizarNotas });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciarNotas);
    } else {
        iniciarNotas();
    }
})();

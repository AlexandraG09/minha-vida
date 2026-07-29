(function () {
    "use strict";

    let elementos = {};

    function iniciarCasa() {
        elementos = {
            botaoNovo: document.querySelector(
                "#botao-nova-compra"
            ),

            modal: document.querySelector(
                "#modal-compra"
            ),

            fecharModal: document.querySelector(
                "#fechar-modal-compra"
            ),

            cancelar: document.querySelector(
                "#cancelar-compra"
            ),

            formulario: document.querySelector(
                "#formulario-compra"
            ),

            tituloModal: document.querySelector(
                "#titulo-modal-compra"
            ),

            campoId: document.querySelector(
                "#compra-id"
            ),

            campoNome: document.querySelector(
                "#compra-nome"
            ),

            campoQuantidade: document.querySelector(
                "#compra-quantidade"
            ),

            campoCategoria: document.querySelector(
                "#compra-categoria"
            ),

            campoSupermercado: document.querySelector(
                "#compra-supermercado"
            ),

            lista: document.querySelector(
                "#lista-compras"
            ),

            estadoVazio: document.querySelector(
                "#compras-vazio"
            ),

            totalPendentes: document.querySelector(
                "#compras-pendentes"
            ),

            totalCompradas: document.querySelector(
                "#compras-compradas"
            ),

            totalInicio: document.querySelector(
                "#total-compras-inicio"
            )
        };

        if (
            !elementos.formulario ||
            !elementos.botaoNovo
        ) {
            return;
        }

        elementos.botaoNovo.addEventListener(
            "click",
            abrirNovaCompra
        );

        elementos.fecharModal.addEventListener(
            "click",
            fecharModal
        );

        elementos.cancelar.addEventListener(
            "click",
            fecharModal
        );

        elementos.formulario.addEventListener(
            "submit",
            guardarCompra
        );

        elementos.lista.addEventListener(
            "click",
            tratarAcaoLista
        );

        elementos.modal.addEventListener(
            "click",
            function (evento) {
                if (evento.target === elementos.modal) {
                    fecharModal();
                }
            }
        );

        document.addEventListener(
            "keydown",
            function (evento) {
                if (
                    evento.key === "Escape" &&
                    !elementos.modal.classList.contains(
                        "oculto"
                    )
                ) {
                    fecharModal();
                }
            }
        );

        atualizarCompras();
    }

    function abrirNovaCompra() {
        elementos.formulario.reset();

        elementos.campoId.value = "";
        elementos.campoQuantidade.value = "1";
        elementos.campoCategoria.value = "Mercearia";
        elementos.campoSupermercado.value = "Outro";

        elementos.tituloModal.textContent =
            "Novo produto";

        mostrarModal();

        setTimeout(function () {
            elementos.campoNome.focus();
        }, 100);
    }

    async function abrirEdicao(id) {
        try {
            const compra =
                await window.MinhaVidaDB.obter(
                    window.MinhaVidaDB.LOJAS.compras,
                    id
                );

            if (!compra) {
                return;
            }

            elementos.campoId.value = compra.id;
            elementos.campoNome.value = compra.nome;
            elementos.campoQuantidade.value =
                compra.quantidade;

            elementos.campoCategoria.value =
                compra.categoria;

            elementos.campoSupermercado.value =
                compra.supermercado;

            elementos.tituloModal.textContent =
                "Editar produto";

            mostrarModal();
        } catch (erro) {
            console.error(erro);

            alert(
                "Não foi possível abrir o produto."
            );
        }
    }

    function mostrarModal() {
        elementos.modal.classList.remove("oculto");

        document.body.classList.add(
            "modal-aberto"
        );
    }

    function fecharModal() {
        elementos.modal.classList.add("oculto");

        document.body.classList.remove(
            "modal-aberto"
        );

        elementos.formulario.reset();
        elementos.campoId.value = "";
    }

    async function guardarCompra(evento) {
        evento.preventDefault();

        const nome =
            elementos.campoNome.value.trim();

        const quantidade = Number.parseInt(
            elementos.campoQuantidade.value,
            10
        );

        if (!nome) {
            alert("Escreve o nome do produto.");
            elementos.campoNome.focus();
            return;
        }

        if (
            !Number.isInteger(quantidade) ||
            quantidade < 1
        ) {
            alert("Escolhe uma quantidade válida.");
            elementos.campoQuantidade.focus();
            return;
        }

        const idExistente =
            elementos.campoId.value;

        let compraExistente = null;

        if (idExistente) {
            compraExistente =
                await window.MinhaVidaDB.obter(
                    window.MinhaVidaDB.LOJAS.compras,
                    idExistente
                );
        }

        const compra = {
            id:
                idExistente ||
                window.MinhaVidaDB.criarId(),

            nome: nome,
            quantidade: quantidade,

            categoria:
                elementos.campoCategoria.value,

            supermercado:
                elementos.campoSupermercado.value,

            comprado:
                compraExistente?.comprado || false,

            dataCriacao:
                compraExistente?.dataCriacao ||
                new Date().toISOString()
        };

        const botaoGuardar =
            elementos.formulario.querySelector(
                'button[type="submit"]'
            );

        botaoGuardar.disabled = true;
        botaoGuardar.textContent = "A guardar…";

        try {
            await window.MinhaVidaDB.guardar(
                window.MinhaVidaDB.LOJAS.compras,
                compra
            );

            fecharModal();
            await atualizarCompras();
        } catch (erro) {
            console.error(erro);

            alert(
                "Não foi possível guardar o produto."
            );
        } finally {
            botaoGuardar.disabled = false;
            botaoGuardar.textContent = "Guardar";
        }
    }

    async function atualizarCompras() {
        try {
            const compras =
                await window.MinhaVidaDB.listar(
                    window.MinhaVidaDB.LOJAS.compras
                );

            compras.sort(
                function (primeira, segunda) {
                    if (
                        primeira.comprado !==
                        segunda.comprado
                    ) {
                        return primeira.comprado
                            ? 1
                            : -1;
                    }

                    return (
                        segunda.dataCriacao || ""
                    ).localeCompare(
                        primeira.dataCriacao || ""
                    );
                }
            );

            mostrarCompras(compras);
            atualizarResumo(compras);
        } catch (erro) {
            console.error(erro);

            elementos.lista.textContent =
                "Não foi possível carregar a lista.";
        }
    }

    function mostrarCompras(compras) {
        elementos.lista.replaceChildren();

        const temCompras = compras.length > 0;

        elementos.lista.classList.toggle(
            "oculto",
            !temCompras
        );

        elementos.estadoVazio.classList.toggle(
            "oculto",
            temCompras
        );

        compras.forEach(function (compra) {
            elementos.lista.appendChild(
                criarLinhaCompra(compra)
            );
        });
    }

    function criarLinhaCompra(compra) {
        const artigo =
            document.createElement("article");

        artigo.className = compra.comprado
            ? "linha-compra comprada"
            : "linha-compra";

        const botaoEstado =
            document.createElement("button");

        botaoEstado.type = "button";
        botaoEstado.className = "estado-compra";
        botaoEstado.dataset.acao = "alternar";
        botaoEstado.dataset.id = compra.id;

        botaoEstado.setAttribute(
            "aria-label",
            compra.comprado
                ? "Marcar como não comprado"
                : "Marcar como comprado"
        );

        botaoEstado.textContent =
            compra.comprado ? "✓" : "";

        const informacao =
            document.createElement("div");

        informacao.className =
            "informacao-compra";

        const nome =
            document.createElement("strong");

        nome.textContent = compra.nome;

        const detalhe =
            document.createElement("span");

        detalhe.textContent =
            `${formatarQuantidade(
                compra.quantidade
            )} · ${compra.categoria}`;

        const supermercado =
            document.createElement("small");

        supermercado.textContent =
            compra.supermercado;

        informacao.append(
            nome,
            detalhe,
            supermercado
        );

        const acoes =
            document.createElement("div");

        acoes.className = "acoes-compra";

        const botaoEditar =
            document.createElement("button");

        botaoEditar.type = "button";
        botaoEditar.textContent = "Editar";
        botaoEditar.dataset.acao = "editar";
        botaoEditar.dataset.id = compra.id;

        const botaoApagar =
            document.createElement("button");

        botaoApagar.type = "button";
        botaoApagar.textContent = "Apagar";
        botaoApagar.dataset.acao = "apagar";
        botaoApagar.dataset.id = compra.id;
        botaoApagar.className = "acao-apagar";

        acoes.append(
            botaoEditar,
            botaoApagar
        );

        artigo.append(
            botaoEstado,
            informacao,
            acoes
        );

        return artigo;
    }

    function formatarQuantidade(quantidade) {
        if (quantidade === 1) {
            return "1 unidade";
        }

        return `${quantidade} unidades`;
    }

    function atualizarResumo(compras) {
        const pendentes = compras.filter(
            function (compra) {
                return !compra.comprado;
            }
        ).length;

        const compradas = compras.filter(
            function (compra) {
                return compra.comprado;
            }
        ).length;

        elementos.totalPendentes.textContent =
            String(pendentes);

        elementos.totalCompradas.textContent =
            String(compradas);

        if (elementos.totalInicio) {
            elementos.totalInicio.textContent =
                String(pendentes);
        }
    }

    async function tratarAcaoLista(evento) {
        const botao = evento.target.closest(
            "button[data-acao]"
        );

        if (!botao) {
            return;
        }

        const id = botao.dataset.id;
        const acao = botao.dataset.acao;

        if (acao === "editar") {
            await abrirEdicao(id);
            return;
        }

        if (acao === "alternar") {
            await alternarEstado(id);
            return;
        }

        if (acao === "apagar") {
            const confirmou = confirm(
                "Queres apagar este produto?"
            );

            if (!confirmou) {
                return;
            }

            try {
                await window.MinhaVidaDB.remover(
                    window.MinhaVidaDB.LOJAS.compras,
                    id
                );

                await atualizarCompras();
            } catch (erro) {
                console.error(erro);

                alert(
                    "Não foi possível apagar o produto."
                );
            }
        }
    }

    async function alternarEstado(id) {
        try {
            const compra =
                await window.MinhaVidaDB.obter(
                    window.MinhaVidaDB.LOJAS.compras,
                    id
                );

            if (!compra) {
                return;
            }

            compra.comprado = !compra.comprado;

            await window.MinhaVidaDB.guardar(
                window.MinhaVidaDB.LOJAS.compras,
                compra
            );

            await atualizarCompras();
        } catch (erro) {
            console.error(erro);

            alert(
                "Não foi possível alterar o produto."
            );
        }
    }

    window.MinhaVidaCasa = Object.freeze({
        atualizar: atualizarCompras
    });

    document.addEventListener(
        "DOMContentLoaded",
        iniciarCasa
    );
})();
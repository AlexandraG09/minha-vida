(function () {
    "use strict";

    const formatadorMoeda = new Intl.NumberFormat(
        "pt-PT",
        {
            style: "currency",
            currency: "EUR"
        }
    );

    const formatadorData = new Intl.DateTimeFormat(
        "pt-PT",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

    let elementos = {};

    function iniciarFinancas() {
        elementos = {
            botaoNovo: document.querySelector(
                "#botao-novo-movimento"
            ),

            modal: document.querySelector(
                "#modal-movimento"
            ),

            fecharModal: document.querySelector(
                "#fechar-modal-movimento"
            ),

            cancelar: document.querySelector(
                "#cancelar-movimento"
            ),

            formulario: document.querySelector(
                "#formulario-movimento"
            ),

            tituloModal: document.querySelector(
                "#titulo-modal-movimento"
            ),

            campoId: document.querySelector(
                "#movimento-id"
            ),

            campoTipo: document.querySelector(
                "#movimento-tipo"
            ),

            campoTitulo: document.querySelector(
                "#movimento-titulo"
            ),

            campoValor: document.querySelector(
                "#movimento-valor"
            ),

            campoCategoria: document.querySelector(
                "#movimento-categoria"
            ),

            campoData: document.querySelector(
                "#movimento-data"
            ),

            campoNotas: document.querySelector(
                "#movimento-notas"
            ),

            lista: document.querySelector(
                "#lista-movimentos"
            ),

            estadoVazio: document.querySelector(
                "#financas-vazio"
            ),

            saldo: document.querySelector(
                "#saldo-financas"
            ),

            receitas: document.querySelector(
                "#total-receitas"
            ),

            despesas: document.querySelector(
                "#total-despesas"
            ),

            saldoInicio: document.querySelector(
                "#saldo-inicio"
            ),

            resumoInicio: document.querySelector(
                "#resumo-saldo-inicio"
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
            abrirNovoMovimento
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
            guardarMovimento
        );

        elementos.modal.addEventListener(
            "click",
            function (evento) {
                if (evento.target === elementos.modal) {
                    fecharModal();
                }
            }
        );

        elementos.lista.addEventListener(
            "click",
            tratarAcaoLista
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

        atualizarFinancas();
    }

    function dataHoje() {
        const agora = new Date();
        const ano = agora.getFullYear();

        const mes = String(
            agora.getMonth() + 1
        ).padStart(2, "0");

        const dia = String(
            agora.getDate()
        ).padStart(2, "0");

        return `${ano}-${mes}-${dia}`;
    }

    function abrirNovoMovimento() {
        elementos.formulario.reset();

        elementos.campoId.value = "";
        elementos.campoTipo.value = "Despesa";
        elementos.campoCategoria.value = "Outros";
        elementos.campoData.value = dataHoje();

        elementos.tituloModal.textContent =
            "Novo movimento";

        mostrarModal();

        setTimeout(function () {
            elementos.campoTitulo.focus();
        }, 100);
    }

    async function abrirEdicao(id) {
        try {
            const movimento =
                await window.MinhaVidaDB.obter(
                    window.MinhaVidaDB.LOJAS.movimentos,
                    id
                );

            if (!movimento) {
                return;
            }

            elementos.campoId.value = movimento.id;
            elementos.campoTipo.value =
                movimento.tipo;

            elementos.campoTitulo.value =
                movimento.titulo;

            elementos.campoValor.value =
                String(movimento.valor)
                    .replace(".", ",");

            elementos.campoCategoria.value =
                movimento.categoria;

            elementos.campoData.value =
                movimento.data;

            elementos.campoNotas.value =
                movimento.notas || "";

            elementos.tituloModal.textContent =
                "Editar movimento";

            mostrarModal();
        } catch (erro) {
            console.error(erro);

            alert(
                "Não foi possível abrir o movimento."
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

    function converterValor(texto) {
        let valor = String(texto)
            .trim()
            .replace(/\s/g, "")
            .replace("€", "");

        if (
            valor.includes(",") &&
            valor.includes(".")
        ) {
            if (
                valor.lastIndexOf(",") >
                valor.lastIndexOf(".")
            ) {
                valor = valor
                    .replace(/\./g, "")
                    .replace(",", ".");
            } else {
                valor = valor.replace(/,/g, "");
            }
        } else if (valor.includes(",")) {
            valor = valor.replace(",", ".");
        }

        return Number(valor);
    }

    async function guardarMovimento(evento) {
        evento.preventDefault();

        const titulo =
            elementos.campoTitulo.value.trim();

        const valor = converterValor(
            elementos.campoValor.value
        );

        if (!titulo) {
            alert("Escreve uma descrição.");
            elementos.campoTitulo.focus();
            return;
        }

        if (
            !Number.isFinite(valor) ||
            valor <= 0
        ) {
            alert("Escreve um valor válido.");
            elementos.campoValor.focus();
            return;
        }

        const idExistente =
            elementos.campoId.value;

        let dataCriacao =
            new Date().toISOString();

        if (idExistente) {
            const movimentoExistente =
                await window.MinhaVidaDB.obter(
                    window.MinhaVidaDB.LOJAS.movimentos,
                    idExistente
                );

            if (movimentoExistente?.dataCriacao) {
                dataCriacao =
                    movimentoExistente.dataCriacao;
            }
        }

        const movimento = {
            id:
                idExistente ||
                window.MinhaVidaDB.criarId(),

            titulo: titulo,
            valor: valor,
            tipo: elementos.campoTipo.value,
            categoria:
                elementos.campoCategoria.value,

            data:
                elementos.campoData.value ||
                dataHoje(),

            notas:
                elementos.campoNotas.value.trim(),

            dataCriacao: dataCriacao
        };

        const botaoGuardar =
            elementos.formulario.querySelector(
                'button[type="submit"]'
            );

        botaoGuardar.disabled = true;
        botaoGuardar.textContent = "A guardar…";

        try {
            await window.MinhaVidaDB.guardar(
                window.MinhaVidaDB.LOJAS.movimentos,
                movimento
            );

            fecharModal();
            await atualizarFinancas();
        } catch (erro) {
            console.error(erro);

            alert(
                "Não foi possível guardar o movimento."
            );
        } finally {
            botaoGuardar.disabled = false;
            botaoGuardar.textContent = "Guardar";
        }
    }

    async function atualizarFinancas() {
        try {
            const movimentos =
                await window.MinhaVidaDB.listar(
                    window.MinhaVidaDB.LOJAS.movimentos
                );

            movimentos.sort(
                function (primeiro, segundo) {
                    if (
                        primeiro.data !== segundo.data
                    ) {
                        return segundo.data.localeCompare(
                            primeiro.data
                        );
                    }

                    return (
                        segundo.dataCriacao || ""
                    ).localeCompare(
                        primeiro.dataCriacao || ""
                    );
                }
            );

            mostrarMovimentos(movimentos);
            atualizarResumo(movimentos);
        } catch (erro) {
            console.error(erro);

            elementos.lista.textContent =
                "Não foi possível carregar os movimentos.";
        }
    }

    function mostrarMovimentos(movimentos) {
        elementos.lista.replaceChildren();

        const temMovimentos =
            movimentos.length > 0;

        elementos.lista.classList.toggle(
            "oculto",
            !temMovimentos
        );

        elementos.estadoVazio.classList.toggle(
            "oculto",
            temMovimentos
        );

        movimentos.forEach(function (movimento) {
            elementos.lista.appendChild(
                criarLinhaMovimento(movimento)
            );
        });
    }

    function criarLinhaMovimento(movimento) {
        const artigo =
            document.createElement("article");

        artigo.className = "linha-movimento";

        const icone =
            document.createElement("div");

        icone.className =
            movimento.tipo === "Receita"
                ? "icone-movimento receita"
                : "icone-movimento despesa";

        icone.textContent =
            movimento.tipo === "Receita"
                ? "↓"
                : "↑";

        const informacao =
            document.createElement("div");

        informacao.className =
            "informacao-movimento";

        const titulo =
            document.createElement("strong");

        titulo.textContent = movimento.titulo;

        const detalhe =
            document.createElement("span");

        detalhe.textContent =
            `${movimento.categoria} · ` +
            formatarData(movimento.data);

        informacao.append(titulo, detalhe);

        const ladoDireito =
            document.createElement("div");

        ladoDireito.className =
            "lado-direito-movimento";

        const valor =
            document.createElement("strong");

        valor.className =
            movimento.tipo === "Receita"
                ? "valor-receita"
                : "valor-despesa";

        valor.textContent =
            `${movimento.tipo === "Receita"
                ? "+"
                : "-"
            }${formatadorMoeda.format(
                movimento.valor
            )}`;

        const acoes =
            document.createElement("div");

        acoes.className = "acoes-movimento";

        const botaoEditar =
            document.createElement("button");

        botaoEditar.type = "button";
        botaoEditar.textContent = "Editar";
        botaoEditar.dataset.acao = "editar";
        botaoEditar.dataset.id = movimento.id;

        const botaoApagar =
            document.createElement("button");

        botaoApagar.type = "button";
        botaoApagar.textContent = "Apagar";
        botaoApagar.dataset.acao = "apagar";
        botaoApagar.dataset.id = movimento.id;
        botaoApagar.className = "acao-apagar";

        acoes.append(
            botaoEditar,
            botaoApagar
        );

        ladoDireito.append(valor, acoes);

        artigo.append(
            icone,
            informacao,
            ladoDireito
        );

        return artigo;
    }

    function formatarData(data) {
        if (!data) {
            return "";
        }

        return formatadorData.format(
            new Date(`${data}T12:00:00`)
        );
    }

    function movimentosDoMesAtual(
        movimentos
    ) {
        const agora = new Date();

        const prefixo =
            `${agora.getFullYear()}-` +
            `${String(
                agora.getMonth() + 1
            ).padStart(2, "0")}`;

        return movimentos.filter(
            function (movimento) {
                return movimento.data.startsWith(
                    prefixo
                );
            }
        );
    }

    function atualizarResumo(movimentos) {
        const movimentosMes =
            movimentosDoMesAtual(movimentos);

        const receitas = movimentosMes
            .filter(function (movimento) {
                return movimento.tipo === "Receita";
            })
            .reduce(function (total, movimento) {
                return total + movimento.valor;
            }, 0);

        const despesas = movimentosMes
            .filter(function (movimento) {
                return movimento.tipo === "Despesa";
            })
            .reduce(function (total, movimento) {
                return total + movimento.valor;
            }, 0);

        const saldo = receitas - despesas;

        elementos.saldo.textContent =
            formatadorMoeda.format(saldo);

        elementos.receitas.textContent =
            formatadorMoeda.format(receitas);

        elementos.despesas.textContent =
            formatadorMoeda.format(despesas);

        if (elementos.saldoInicio) {
            elementos.saldoInicio.textContent =
                formatadorMoeda.format(saldo);
        }

        if (elementos.resumoInicio) {
            if (movimentosMes.length === 0) {
                elementos.resumoInicio.textContent =
                    "Ainda não existem movimentos.";
            } else if (movimentosMes.length === 1) {
                elementos.resumoInicio.textContent =
                    "1 movimento neste mês.";
            } else {
                elementos.resumoInicio.textContent =
                    `${movimentosMes.length} movimentos neste mês.`;
            }
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

        if (acao === "apagar") {
            const confirmou = confirm(
                "Queres apagar este movimento?"
            );

            if (!confirmou) {
                return;
            }

            try {
                await window.MinhaVidaDB.remover(
                    window.MinhaVidaDB.LOJAS.movimentos,
                    id
                );

                await atualizarFinancas();
            } catch (erro) {
                console.error(erro);

                alert(
                    "Não foi possível apagar o movimento."
                );
            }
        }
    }

    window.MinhaVidaFinancas = Object.freeze({
        atualizar: atualizarFinancas
    });

    document.addEventListener(
        "DOMContentLoaded",
        iniciarFinancas
    );
})();
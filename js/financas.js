(function () {
    "use strict";

    const CATEGORIAS = Object.freeze({
        Receita: [
            "Salário",
            "Trabalho extra",
            "Reembolso",
            "Presente",
            "Outros"
        ],
        Despesa: [
            "Casa",
            "Alimentação",
            "Transportes",
            "Saúde",
            "Lazer",
            "Compras",
            "Subscrições",
            "Educação",
            "Outros"
        ]
    });

    const formatadorMoeda = new Intl.NumberFormat("pt-PT", {
        style: "currency",
        currency: "EUR"
    });

    const formatadorData = new Intl.DateTimeFormat("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    let elementos = {};

    function iniciarFinancas() {
        elementos = {
            botaoNovo: document.querySelector("#botao-novo-movimento"),
            botaoVazio: document.querySelector("#botao-primeiro-movimento"),
            modal: document.querySelector("#modal-movimento"),
            fecharModal: document.querySelector("#fechar-modal-movimento"),
            cancelar: document.querySelector("#cancelar-movimento"),
            formulario: document.querySelector("#formulario-movimento"),
            tituloModal: document.querySelector("#titulo-modal-movimento"),
            campoId: document.querySelector("#movimento-id"),
            campoTipo: document.querySelector("#movimento-tipo"),
            campoTitulo: document.querySelector("#movimento-titulo"),
            campoValor: document.querySelector("#movimento-valor"),
            campoCategoria: document.querySelector("#movimento-categoria"),
            campoData: document.querySelector("#movimento-data"),
            campoNotas: document.querySelector("#movimento-notas"),
            lista: document.querySelector("#lista-movimentos"),
            estadoVazio: document.querySelector("#financas-vazio"),
            saldo: document.querySelector("#saldo-financas"),
            receitas: document.querySelector("#total-receitas"),
            despesas: document.querySelector("#total-despesas"),
            saldoInicio: document.querySelector("#saldo-inicio"),
            receitasInicio: document.querySelector("#receitas-inicio"),
            despesasInicio: document.querySelector("#despesas-inicio"),
            mes: document.querySelector("#mes-financas")
        };

        if (!elementos.formulario || !elementos.botaoNovo) {
            return;
        }

        elementos.botaoNovo.addEventListener("click", abrirNovoMovimento);
        elementos.botaoVazio?.addEventListener("click", abrirNovoMovimento);
        elementos.fecharModal.addEventListener("click", fecharModal);
        elementos.cancelar.addEventListener("click", fecharModal);
        elementos.formulario.addEventListener("submit", guardarMovimento);
        elementos.campoTipo.addEventListener("change", function () {
            preencherCategorias(elementos.campoTipo.value);
        });
        elementos.lista.addEventListener("click", tratarAcaoLista);
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

        preencherCategorias("Despesa");
        atualizarMes();
        atualizarFinancas();
    }

    function atualizarMes() {
        if (!elementos.mes) {
            return;
        }

        const mes = new Intl.DateTimeFormat("pt-PT", {
            month: "long",
            year: "numeric"
        }).format(new Date());

        elementos.mes.textContent = mes;
    }

    function preencherCategorias(tipo, categoriaSelecionada = null) {
        elementos.campoCategoria.replaceChildren();

        CATEGORIAS[tipo].forEach(function (categoria) {
            const opcao = document.createElement("option");
            opcao.value = categoria;
            opcao.textContent = categoria;
            opcao.selected = categoria === categoriaSelecionada;
            elementos.campoCategoria.appendChild(opcao);
        });
    }

    function dataHoje() {
        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, "0");
        const dia = String(agora.getDate()).padStart(2, "0");
        return `${ano}-${mes}-${dia}`;
    }

    function abrirNovoMovimento() {
        elementos.formulario.reset();
        elementos.campoId.value = "";
        elementos.campoTipo.value = "Despesa";
        preencherCategorias("Despesa", "Casa");
        elementos.campoData.value = dataHoje();
        elementos.tituloModal.textContent = "Novo movimento";
        mostrarModal();
        setTimeout(function () {
            elementos.campoTitulo.focus();
        }, 100);
    }

    async function abrirEdicao(id) {
        try {
            const movimento = await window.MinhaVidaDB.obter(
                window.MinhaVidaDB.LOJAS.movimentos,
                id
            );

            if (!movimento) {
                return;
            }

            elementos.campoId.value = movimento.id;
            elementos.campoTipo.value = movimento.tipo;
            preencherCategorias(movimento.tipo, movimento.categoria);
            elementos.campoTitulo.value = movimento.titulo;
            elementos.campoValor.value = String(movimento.valor).replace(".", ",");
            elementos.campoData.value = movimento.data;
            elementos.campoNotas.value = movimento.notas || "";
            elementos.tituloModal.textContent = "Editar movimento";
            mostrarModal();
        } catch (erro) {
            console.error(erro);
            alert("Não foi possível abrir o movimento.");
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
    }

    function converterValor(texto) {
        let valor = String(texto)
            .trim()
            .replace(/\s/g, "")
            .replace("€", "");

        if (valor.includes(",") && valor.includes(".")) {
            if (valor.lastIndexOf(",") > valor.lastIndexOf(".")) {
                valor = valor.replace(/\./g, "").replace(",", ".");
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

        const titulo = elementos.campoTitulo.value.trim();
        const valor = converterValor(elementos.campoValor.value);

        if (!titulo) {
            alert("Escreve uma descrição.");
            elementos.campoTitulo.focus();
            return;
        }

        if (!Number.isFinite(valor) || valor <= 0) {
            alert("Escreve um valor válido.");
            elementos.campoValor.focus();
            return;
        }

        const idExistente = elementos.campoId.value;
        let movimentoExistente = null;

        if (idExistente) {
            movimentoExistente = await window.MinhaVidaDB.obter(
                window.MinhaVidaDB.LOJAS.movimentos,
                idExistente
            );
        }

        const movimento = {
            id: idExistente || window.MinhaVidaDB.criarId(),
            titulo,
            valor,
            tipo: elementos.campoTipo.value,
            categoria: elementos.campoCategoria.value,
            data: elementos.campoData.value || dataHoje(),
            notas: elementos.campoNotas.value.trim(),
            dataCriacao: movimentoExistente?.dataCriacao || new Date().toISOString()
        };

        const botaoGuardar = elementos.formulario.querySelector('button[type="submit"]');
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
            alert("Não foi possível guardar o movimento.");
        } finally {
            botaoGuardar.disabled = false;
            botaoGuardar.textContent = "Guardar";
        }
    }

    async function atualizarFinancas() {
        try {
            const movimentos = await window.MinhaVidaDB.listar(
                window.MinhaVidaDB.LOJAS.movimentos
            );

            movimentos.sort(function (primeiro, segundo) {
                if (primeiro.data !== segundo.data) {
                    return segundo.data.localeCompare(primeiro.data);
                }
                return (segundo.dataCriacao || "").localeCompare(primeiro.dataCriacao || "");
            });

            mostrarMovimentos(movimentos);
            atualizarResumo(movimentos);
        } catch (erro) {
            console.error(erro);
            elementos.lista.textContent = "Não foi possível carregar os movimentos.";
        }
    }

    function mostrarMovimentos(movimentos) {
        elementos.lista.replaceChildren();
        const temMovimentos = movimentos.length > 0;
        elementos.lista.classList.toggle("oculto", !temMovimentos);
        elementos.estadoVazio.classList.toggle("oculto", temMovimentos);

        movimentos.forEach(function (movimento) {
            elementos.lista.appendChild(criarLinhaMovimento(movimento));
        });
    }

    function criarLinhaMovimento(movimento) {
        const artigo = document.createElement("article");
        artigo.className = "linha-item";

        const icone = document.createElement("div");
        icone.className = `icone-item ${movimento.tipo === "Receita" ? "receita" : "despesa"}`;
        icone.textContent = movimento.tipo === "Receita" ? "↙" : "↗";

        const informacao = document.createElement("div");
        informacao.className = "informacao-item";

        const titulo = document.createElement("strong");
        titulo.textContent = movimento.titulo;

        const detalhe = document.createElement("span");
        detalhe.textContent = `${movimento.categoria} · ${formatarData(movimento.data)}`;

        informacao.append(titulo, detalhe);

        const ladoDireito = document.createElement("div");
        ladoDireito.className = "lado-direito-item";

        const valor = document.createElement("strong");
        valor.className = movimento.tipo === "Receita" ? "valor-positivo" : "valor-negativo";
        valor.textContent = `${movimento.tipo === "Receita" ? "+" : "-"}${formatadorMoeda.format(movimento.valor)}`;

        const acoes = criarAcoes(movimento.id);
        ladoDireito.append(valor, acoes);
        artigo.append(icone, informacao, ladoDireito);

        return artigo;
    }

    function criarAcoes(id) {
        const acoes = document.createElement("div");
        acoes.className = "acoes-item";

        const editar = document.createElement("button");
        editar.type = "button";
        editar.textContent = "Editar";
        editar.dataset.acao = "editar";
        editar.dataset.id = id;

        const apagar = document.createElement("button");
        apagar.type = "button";
        apagar.textContent = "Apagar";
        apagar.dataset.acao = "apagar";
        apagar.dataset.id = id;
        apagar.className = "acao-apagar";

        acoes.append(editar, apagar);
        return acoes;
    }

    function formatarData(data) {
        return formatadorData.format(new Date(`${data}T12:00:00`));
    }

    function movimentosDoMesAtual(movimentos) {
        const agora = new Date();
        const prefixo = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
        return movimentos.filter(function (movimento) {
            return movimento.data.startsWith(prefixo);
        });
    }

    function atualizarResumo(movimentos) {
        const movimentosMes = movimentosDoMesAtual(movimentos);
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
        elementos.saldo.textContent = formatadorMoeda.format(saldo);
        elementos.receitas.textContent = formatadorMoeda.format(receitas);
        elementos.despesas.textContent = formatadorMoeda.format(despesas);
        elementos.saldoInicio.textContent = formatadorMoeda.format(saldo);
        elementos.receitasInicio.textContent = formatadorMoeda.format(receitas);
        elementos.despesasInicio.textContent = formatadorMoeda.format(despesas);
    }

    async function tratarAcaoLista(evento) {
        const botao = evento.target.closest("button[data-acao]");
        if (!botao) {
            return;
        }

        const id = botao.dataset.id;
        if (botao.dataset.acao === "editar") {
            await abrirEdicao(id);
            return;
        }

        if (botao.dataset.acao === "apagar") {
            if (!confirm("Queres apagar este movimento?")) {
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
                alert("Não foi possível apagar o movimento.");
            }
        }
    }

    window.MinhaVidaFinancas = Object.freeze({ atualizar: atualizarFinancas });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciarFinancas);
    } else {
        iniciarFinancas();
    }
})();

(function () {
    "use strict";

    const formatadorMoeda = new Intl.NumberFormat("pt-PT", {
        style: "currency",
        currency: "EUR"
    });

    const formatadorDataHora = new Intl.DateTimeFormat("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    const formatadorDataCurta = new Intl.DateTimeFormat("pt-PT", {
        weekday: "short",
        day: "2-digit",
        month: "short"
    });

    let elementos = {};

    function iniciarPrazos() {
        elementos = {
            botaoNovo: document.querySelector("#botao-novo-prazo"),
            botaoVazio: document.querySelector("#botao-primeiro-prazo"),
            modal: document.querySelector("#modal-prazo"),
            fecharModal: document.querySelector("#fechar-modal-prazo"),
            cancelar: document.querySelector("#cancelar-prazo"),
            formulario: document.querySelector("#formulario-prazo"),
            tituloModal: document.querySelector("#titulo-modal-prazo"),
            campoId: document.querySelector("#prazo-id"),
            campoTitulo: document.querySelector("#prazo-titulo"),
            campoCategoria: document.querySelector("#prazo-categoria"),
            campoData: document.querySelector("#prazo-data"),
            campoValor: document.querySelector("#prazo-valor"),
            campoNotas: document.querySelector("#prazo-notas"),
            lista: document.querySelector("#lista-prazos"),
            estadoVazio: document.querySelector("#prazos-vazio"),
            totalPendentes: document.querySelector("#prazos-pendentes"),
            totalAtrasados: document.querySelector("#prazos-atrasados"),
            totalInicio: document.querySelector("#total-prazos-inicio"),
            listaInicio: document.querySelector("#lista-prazos-inicio"),
            vazioInicio: document.querySelector("#prazos-inicio-vazio")
        };

        if (!elementos.formulario || !elementos.botaoNovo) {
            return;
        }

        elementos.botaoNovo.addEventListener("click", abrirNovoPrazo);
        elementos.botaoVazio?.addEventListener("click", abrirNovoPrazo);
        elementos.fecharModal.addEventListener("click", fecharModal);
        elementos.cancelar.addEventListener("click", fecharModal);
        elementos.formulario.addEventListener("submit", guardarPrazo);
        elementos.lista.addEventListener("click", tratarAcaoLista);
        elementos.listaInicio?.addEventListener("click", function () {
            window.MinhaVidaApp?.mostrarPagina("prazos");
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

        atualizarPrazos();
    }

    function abrirNovoPrazo() {
        elementos.formulario.reset();
        elementos.campoId.value = "";
        elementos.campoCategoria.value = "Casa";
        elementos.campoData.value = dataInicialNovoPrazo();
        elementos.tituloModal.textContent = "Novo prazo";
        mostrarModal();
        setTimeout(function () {
            elementos.campoTitulo.focus();
        }, 100);
    }

    async function abrirEdicao(id) {
        try {
            const prazo = await window.MinhaVidaDB.obter(
                window.MinhaVidaDB.LOJAS.prazos,
                id
            );

            if (!prazo) {
                return;
            }

            elementos.campoId.value = prazo.id;
            elementos.campoTitulo.value = prazo.titulo;
            elementos.campoCategoria.value = prazo.categoria;
            elementos.campoData.value = prazo.dataLimite;
            elementos.campoValor.value =
                prazo.valor === null || prazo.valor === undefined
                    ? ""
                    : String(prazo.valor).replace(".", ",");
            elementos.campoNotas.value = prazo.notas || "";
            elementos.tituloModal.textContent = "Editar prazo";
            mostrarModal();
        } catch (erro) {
            console.error(erro);
            alert("Não foi possível abrir o prazo.");
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

    function dataInicialNovoPrazo() {
        const data = new Date();
        data.setDate(data.getDate() + 1);
        data.setHours(9, 0, 0, 0);
        return converterParaCampoData(data);
    }

    function converterParaCampoData(data) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const dia = String(data.getDate()).padStart(2, "0");
        const hora = String(data.getHours()).padStart(2, "0");
        const minuto = String(data.getMinutes()).padStart(2, "0");
        return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
    }

    function converterValor(texto) {
        const textoLimpo = String(texto)
            .trim()
            .replace(/\s/g, "")
            .replace("€", "");

        if (!textoLimpo) {
            return null;
        }

        let valor = textoLimpo;

        if (valor.includes(",") && valor.includes(".")) {
            if (valor.lastIndexOf(",") > valor.lastIndexOf(".")) {
                valor = valor.replace(/\./g, "").replace(",", ".");
            } else {
                valor = valor.replace(/,/g, "");
            }
        } else if (valor.includes(",")) {
            valor = valor.replace(",", ".");
        }

        const numero = Number(valor);
        return Number.isFinite(numero) ? numero : NaN;
    }

    async function guardarPrazo(evento) {
        evento.preventDefault();

        const titulo = elementos.campoTitulo.value.trim();
        const dataLimite = elementos.campoData.value;
        const valor = converterValor(elementos.campoValor.value);

        if (!titulo) {
            alert("Escreve o título do prazo.");
            elementos.campoTitulo.focus();
            return;
        }

        if (!dataLimite) {
            alert("Escolhe a data e a hora.");
            elementos.campoData.focus();
            return;
        }

        if (valor !== null && (!Number.isFinite(valor) || valor < 0)) {
            alert("Escreve um valor válido ou deixa o campo vazio.");
            elementos.campoValor.focus();
            return;
        }

        const idExistente = elementos.campoId.value;
        let prazoExistente = null;

        if (idExistente) {
            prazoExistente = await window.MinhaVidaDB.obter(
                window.MinhaVidaDB.LOJAS.prazos,
                idExistente
            );
        }

        const prazo = {
            id: idExistente || window.MinhaVidaDB.criarId(),
            titulo,
            categoria: elementos.campoCategoria.value,
            dataLimite,
            valor,
            notas: elementos.campoNotas.value.trim(),
            concluido: prazoExistente?.concluido || false,
            dataCriacao: prazoExistente?.dataCriacao || new Date().toISOString()
        };

        const botaoGuardar = elementos.formulario.querySelector('button[type="submit"]');
        botaoGuardar.disabled = true;
        botaoGuardar.textContent = "A guardar…";

        try {
            await window.MinhaVidaDB.guardar(
                window.MinhaVidaDB.LOJAS.prazos,
                prazo
            );
            fecharModal();
            await atualizarPrazos();
        } catch (erro) {
            console.error(erro);
            alert("Não foi possível guardar o prazo.");
        } finally {
            botaoGuardar.disabled = false;
            botaoGuardar.textContent = "Guardar";
        }
    }

    async function atualizarPrazos() {
        try {
            const prazos = await window.MinhaVidaDB.listar(
                window.MinhaVidaDB.LOJAS.prazos
            );

            prazos.sort(ordenarPrazos);
            mostrarPrazos(prazos);
            atualizarResumo(prazos);
            mostrarProximosSeteDias(prazos);
        } catch (erro) {
            console.error(erro);
            elementos.lista.textContent = "Não foi possível carregar os prazos.";
        }
    }

    function ordenarPrazos(primeiro, segundo) {
        if (primeiro.concluido !== segundo.concluido) {
            return primeiro.concluido ? 1 : -1;
        }
        return primeiro.dataLimite.localeCompare(segundo.dataLimite);
    }

    function mostrarPrazos(prazos) {
        elementos.lista.replaceChildren();
        const temPrazos = prazos.length > 0;
        elementos.lista.classList.toggle("oculto", !temPrazos);
        elementos.estadoVazio.classList.toggle("oculto", temPrazos);

        prazos.forEach(function (prazo) {
            elementos.lista.appendChild(criarLinhaPrazo(prazo));
        });
    }

    function criarLinhaPrazo(prazo) {
        const artigo = document.createElement("article");
        artigo.className = "linha-item prazo";

        if (prazo.concluido) {
            artigo.classList.add("concluido");
        } else if (estaAtrasado(prazo)) {
            artigo.classList.add("atrasado");
        }

        const botaoEstado = document.createElement("button");
        botaoEstado.type = "button";
        botaoEstado.className = "estado-circular";
        botaoEstado.dataset.acao = "alternar";
        botaoEstado.dataset.id = prazo.id;
        botaoEstado.setAttribute(
            "aria-label",
            prazo.concluido ? "Marcar como pendente" : "Marcar como concluído"
        );
        botaoEstado.textContent = prazo.concluido ? "✓" : "";

        const dataVisual = criarDataVisual(new Date(prazo.dataLimite));

        const informacao = document.createElement("div");
        informacao.className = "informacao-item";

        const titulo = document.createElement("strong");
        titulo.textContent = prazo.titulo;

        const detalhe = document.createElement("span");
        detalhe.textContent = `${prazo.categoria} · ${formatadorDataHora.format(new Date(prazo.dataLimite))}`;

        const estado = document.createElement("small");
        estado.textContent = textoEstado(prazo);

        informacao.append(titulo, detalhe, estado);

        const ladoDireito = document.createElement("div");
        ladoDireito.className = "lado-direito-item";

        if (prazo.valor !== null && prazo.valor !== undefined) {
            const valor = document.createElement("strong");
            valor.className = "valor-prazo";
            valor.textContent = formatadorMoeda.format(prazo.valor);
            ladoDireito.appendChild(valor);
        }

        ladoDireito.appendChild(criarAcoes(prazo.id));
        artigo.append(botaoEstado, dataVisual, informacao, ladoDireito);
        return artigo;
    }

    function criarDataVisual(data) {
        const dataVisual = document.createElement("div");
        dataVisual.className = "data-prazo";

        const dia = document.createElement("strong");
        dia.textContent = String(data.getDate()).padStart(2, "0");

        const mes = document.createElement("span");
        mes.textContent = data.toLocaleDateString("pt-PT", { month: "short" });

        dataVisual.append(dia, mes);
        return dataVisual;
    }

    function criarAcoes(id) {
        const acoes = document.createElement("div");
        acoes.className = "acoes-item vertical";

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

    function inicioDoDia(data) {
        return new Date(data.getFullYear(), data.getMonth(), data.getDate());
    }

    function estaAtrasado(prazo) {
        return !prazo.concluido && new Date(prazo.dataLimite) < new Date();
    }

    function textoEstado(prazo) {
        if (prazo.concluido) {
            return "Concluído";
        }
        if (estaAtrasado(prazo)) {
            return "Atrasado";
        }

        const hoje = inicioDoDia(new Date());
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);
        const dataPrazo = inicioDoDia(new Date(prazo.dataLimite));

        if (dataPrazo.getTime() === hoje.getTime()) {
            return "Hoje";
        }
        if (dataPrazo.getTime() === amanha.getTime()) {
            return "Amanhã";
        }
        return "Pendente";
    }

    function atualizarResumo(prazos) {
        const pendentes = prazos.filter(function (prazo) {
            return !prazo.concluido;
        }).length;

        const atrasados = prazos.filter(estaAtrasado).length;
        elementos.totalPendentes.textContent = String(pendentes);
        elementos.totalAtrasados.textContent = String(atrasados);
        elementos.totalInicio.textContent = String(pendentes);
    }

    function mostrarProximosSeteDias(prazos) {
        if (!elementos.listaInicio || !elementos.vazioInicio) {
            return;
        }

        const agora = new Date();
        const limite = new Date();
        limite.setDate(limite.getDate() + 7);
        limite.setHours(23, 59, 59, 999);

        const proximos = prazos.filter(function (prazo) {
            const data = new Date(prazo.dataLimite);
            return !prazo.concluido && data >= agora && data <= limite;
        });

        elementos.listaInicio.replaceChildren();
        const existem = proximos.length > 0;
        elementos.listaInicio.classList.toggle("oculto", !existem);
        elementos.vazioInicio.classList.toggle("oculto", existem);

        proximos.forEach(function (prazo) {
            const botao = document.createElement("button");
            botao.type = "button";
            botao.className = "prazo-inicio";

            const data = document.createElement("span");
            data.className = "prazo-inicio-data";
            data.textContent = formatadorDataCurta.format(new Date(prazo.dataLimite));

            const texto = document.createElement("div");
            const titulo = document.createElement("strong");
            titulo.textContent = prazo.titulo;
            const detalhe = document.createElement("small");
            detalhe.textContent = `${prazo.categoria} · ${textoEstado(prazo)}`;
            texto.append(titulo, detalhe);

            const seta = document.createElement("span");
            seta.className = "prazo-inicio-seta";
            seta.textContent = "›";

            botao.append(data, texto, seta);
            botao.addEventListener("click", function () {
                window.MinhaVidaApp?.mostrarPagina("prazos");
            });
            elementos.listaInicio.appendChild(botao);
        });
    }

    async function tratarAcaoLista(evento) {
        const botao = evento.target.closest("button[data-acao]");
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
            if (!confirm("Queres apagar este prazo?")) {
                return;
            }

            try {
                await window.MinhaVidaDB.remover(
                    window.MinhaVidaDB.LOJAS.prazos,
                    id
                );
                await atualizarPrazos();
            } catch (erro) {
                console.error(erro);
                alert("Não foi possível apagar o prazo.");
            }
        }
    }

    async function alternarEstado(id) {
        try {
            const prazo = await window.MinhaVidaDB.obter(
                window.MinhaVidaDB.LOJAS.prazos,
                id
            );

            if (!prazo) {
                return;
            }

            prazo.concluido = !prazo.concluido;
            await window.MinhaVidaDB.guardar(
                window.MinhaVidaDB.LOJAS.prazos,
                prazo
            );
            await atualizarPrazos();
        } catch (erro) {
            console.error(erro);
            alert("Não foi possível alterar o prazo.");
        }
    }

    window.MinhaVidaPrazos = Object.freeze({ atualizar: atualizarPrazos });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciarPrazos);
    } else {
        iniciarPrazos();
    }
})();

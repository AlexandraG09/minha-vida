(function () {
    "use strict";

    const formatadorData = new Intl.DateTimeFormat("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    let elementos = {};

    function iniciarTarefas() {
        elementos = {
            botaoNovo: document.querySelector("#botao-nova-tarefa"),
            botaoVazio: document.querySelector("#botao-primeira-tarefa"),
            modal: document.querySelector("#modal-tarefa"),
            fecharModal: document.querySelector("#fechar-modal-tarefa"),
            cancelar: document.querySelector("#cancelar-tarefa"),
            formulario: document.querySelector("#formulario-tarefa"),
            tituloModal: document.querySelector("#titulo-modal-tarefa"),
            campoId: document.querySelector("#tarefa-id"),
            campoTitulo: document.querySelector("#tarefa-titulo"),
            campoDivisao: document.querySelector("#tarefa-divisao"),
            campoPrioridade: document.querySelector("#tarefa-prioridade"),
            campoData: document.querySelector("#tarefa-data"),
            campoNotas: document.querySelector("#tarefa-notas"),
            lista: document.querySelector("#lista-tarefas"),
            estadoVazio: document.querySelector("#tarefas-vazio"),
            totalPendentes: document.querySelector("#tarefas-pendentes"),
            totalConcluidas: document.querySelector("#tarefas-concluidas"),
            totalInicio: document.querySelector("#total-tarefas-inicio")
        };

        if (!elementos.formulario || !elementos.botaoNovo) {
            return;
        }

        elementos.botaoNovo.addEventListener("click", abrirNovaTarefa);
        elementos.botaoVazio?.addEventListener("click", abrirNovaTarefa);
        elementos.fecharModal.addEventListener("click", fecharModal);
        elementos.cancelar.addEventListener("click", fecharModal);
        elementos.formulario.addEventListener("submit", guardarTarefa);
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

        atualizarTarefas();
    }

    function abrirNovaTarefa() {
        elementos.formulario.reset();
        elementos.campoId.value = "";
        elementos.campoDivisao.value = "Geral";
        elementos.campoPrioridade.value = "Normal";
        elementos.campoData.value = "";
        elementos.tituloModal.textContent = "Nova tarefa";
        mostrarModal();
        setTimeout(function () {
            elementos.campoTitulo.focus();
        }, 100);
    }

    async function abrirEdicao(id) {
        try {
            const tarefa = await window.MinhaVidaDB.obter(
                window.MinhaVidaDB.LOJAS.tarefas,
                id
            );

            if (!tarefa) {
                return;
            }

            elementos.campoId.value = tarefa.id;
            elementos.campoTitulo.value = tarefa.titulo;
            elementos.campoDivisao.value = tarefa.divisao;
            elementos.campoPrioridade.value = tarefa.prioridade;
            elementos.campoData.value = tarefa.dataLimite || "";
            elementos.campoNotas.value = tarefa.notas || "";
            elementos.tituloModal.textContent = "Editar tarefa";
            mostrarModal();
        } catch (erro) {
            console.error(erro);
            alert("Não foi possível abrir a tarefa.");
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

    async function guardarTarefa(evento) {
        evento.preventDefault();

        const titulo = elementos.campoTitulo.value.trim();
        if (!titulo) {
            alert("Escreve o nome da tarefa.");
            elementos.campoTitulo.focus();
            return;
        }

        const idExistente = elementos.campoId.value;
        let tarefaExistente = null;

        if (idExistente) {
            tarefaExistente = await window.MinhaVidaDB.obter(
                window.MinhaVidaDB.LOJAS.tarefas,
                idExistente
            );
        }

        const tarefa = {
            id: idExistente || window.MinhaVidaDB.criarId(),
            titulo,
            divisao: elementos.campoDivisao.value,
            prioridade: elementos.campoPrioridade.value,
            dataLimite: elementos.campoData.value || null,
            notas: elementos.campoNotas.value.trim(),
            concluida: tarefaExistente?.concluida || false,
            dataCriacao: tarefaExistente?.dataCriacao || new Date().toISOString()
        };

        const botaoGuardar = elementos.formulario.querySelector('button[type="submit"]');
        botaoGuardar.disabled = true;
        botaoGuardar.textContent = "A guardar…";

        try {
            await window.MinhaVidaDB.guardar(
                window.MinhaVidaDB.LOJAS.tarefas,
                tarefa
            );
            fecharModal();
            await atualizarTarefas();
        } catch (erro) {
            console.error(erro);
            alert("Não foi possível guardar a tarefa.");
        } finally {
            botaoGuardar.disabled = false;
            botaoGuardar.textContent = "Guardar";
        }
    }

    async function atualizarTarefas() {
        try {
            const tarefas = await window.MinhaVidaDB.listar(
                window.MinhaVidaDB.LOJAS.tarefas
            );

            tarefas.sort(ordenarTarefas);
            mostrarTarefas(tarefas);
            atualizarResumo(tarefas);
        } catch (erro) {
            console.error(erro);
            elementos.lista.textContent = "Não foi possível carregar as tarefas.";
        }
    }

    function ordenarTarefas(primeira, segunda) {
        if (primeira.concluida !== segunda.concluida) {
            return primeira.concluida ? 1 : -1;
        }

        if (primeira.dataLimite && segunda.dataLimite) {
            return primeira.dataLimite.localeCompare(segunda.dataLimite);
        }
        if (primeira.dataLimite) {
            return -1;
        }
        if (segunda.dataLimite) {
            return 1;
        }

        return (segunda.dataCriacao || "").localeCompare(primeira.dataCriacao || "");
    }

    function mostrarTarefas(tarefas) {
        elementos.lista.replaceChildren();
        const temTarefas = tarefas.length > 0;
        elementos.lista.classList.toggle("oculto", !temTarefas);
        elementos.estadoVazio.classList.toggle("oculto", temTarefas);

        tarefas.forEach(function (tarefa) {
            elementos.lista.appendChild(criarLinhaTarefa(tarefa));
        });
    }

    function criarLinhaTarefa(tarefa) {
        const artigo = document.createElement("article");
        artigo.className = "linha-item";

        if (tarefa.concluida) {
            artigo.classList.add("concluido");
        } else if (estaAtrasada(tarefa)) {
            artigo.classList.add("atrasado");
        }

        const botaoEstado = document.createElement("button");
        botaoEstado.type = "button";
        botaoEstado.className = "estado-circular";
        botaoEstado.dataset.acao = "alternar";
        botaoEstado.dataset.id = tarefa.id;
        botaoEstado.setAttribute(
            "aria-label",
            tarefa.concluida ? "Marcar como pendente" : "Marcar como concluída"
        );
        botaoEstado.textContent = tarefa.concluida ? "✓" : "";

        const informacao = document.createElement("div");
        informacao.className = "informacao-item";

        const titulo = document.createElement("strong");
        titulo.textContent = tarefa.titulo;

        const detalhe = document.createElement("span");
        detalhe.textContent = `${tarefa.divisao} · ${tarefa.prioridade}`;

        const data = document.createElement("small");
        if (tarefa.dataLimite) {
            data.textContent = estaAtrasada(tarefa)
                ? `Atrasada · ${formatarData(tarefa.dataLimite)}`
                : formatarData(tarefa.dataLimite);
        } else {
            data.textContent = "Sem data limite";
        }

        informacao.append(titulo, detalhe, data);
        artigo.append(botaoEstado, informacao, criarAcoes(tarefa.id));
        return artigo;
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

    function dataHoje() {
        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, "0");
        const dia = String(agora.getDate()).padStart(2, "0");
        return `${ano}-${mes}-${dia}`;
    }

    function estaAtrasada(tarefa) {
        return !tarefa.concluida && tarefa.dataLimite && tarefa.dataLimite < dataHoje();
    }

    function formatarData(data) {
        return formatadorData.format(new Date(`${data}T12:00:00`));
    }

    function atualizarResumo(tarefas) {
        const pendentes = tarefas.filter(function (tarefa) {
            return !tarefa.concluida;
        }).length;

        const concluidas = tarefas.filter(function (tarefa) {
            return tarefa.concluida;
        }).length;

        elementos.totalPendentes.textContent = String(pendentes);
        elementos.totalConcluidas.textContent = String(concluidas);
        elementos.totalInicio.textContent = String(pendentes);
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
            if (!confirm("Queres apagar esta tarefa?")) {
                return;
            }

            try {
                await window.MinhaVidaDB.remover(
                    window.MinhaVidaDB.LOJAS.tarefas,
                    id
                );
                await atualizarTarefas();
            } catch (erro) {
                console.error(erro);
                alert("Não foi possível apagar a tarefa.");
            }
        }
    }

    async function alternarEstado(id) {
        try {
            const tarefa = await window.MinhaVidaDB.obter(
                window.MinhaVidaDB.LOJAS.tarefas,
                id
            );

            if (!tarefa) {
                return;
            }

            tarefa.concluida = !tarefa.concluida;
            await window.MinhaVidaDB.guardar(
                window.MinhaVidaDB.LOJAS.tarefas,
                tarefa
            );
            await atualizarTarefas();
        } catch (erro) {
            console.error(erro);
            alert("Não foi possível alterar a tarefa.");
        }
    }

    window.MinhaVidaTarefas = Object.freeze({ atualizar: atualizarTarefas });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciarTarefas);
    } else {
        iniciarTarefas();
    }
})();

(function () {
    "use strict";

    let elementos = {};
    let receitasGuardadas = [];
    let receitaDetalheId = null;
    let categoriaAtiva = "Todas";

    function iniciarReceitas() {
        elementos = {
            botaoNovo: document.querySelector("#botao-nova-receita"),
            botaoVazio: document.querySelector("#botao-primeira-receita"),
            modalFormulario: document.querySelector("#modal-receita"),
            fecharFormulario: document.querySelector("#fechar-modal-receita"),
            cancelarFormulario: document.querySelector("#cancelar-receita"),
            formulario: document.querySelector("#formulario-receita"),
            tituloModal: document.querySelector("#titulo-modal-receita"),
            campoId: document.querySelector("#receita-id"),
            campoTitulo: document.querySelector("#receita-titulo"),
            campoCategoria: document.querySelector("#receita-categoria"),
            campoTempo: document.querySelector("#receita-tempo"),
            campoPorcoes: document.querySelector("#receita-porcoes"),
            campoIngredientes: document.querySelector("#receita-ingredientes"),
            campoPreparacao: document.querySelector("#receita-preparacao"),
            campoFavorita: document.querySelector("#receita-favorita"),
            pesquisa: document.querySelector("#receitas-pesquisa"),
            botoesCategoria: document.querySelectorAll("[data-categoria-receita]"),
            lista: document.querySelector("#lista-receitas"),
            estadoVazio: document.querySelector("#receitas-vazio"),
            semResultados: document.querySelector("#receitas-sem-resultados"),
            total: document.querySelector("#receitas-total"),
            totalFavoritas: document.querySelector("#receitas-favoritas"),
            totalInicio: document.querySelector("#total-receitas-inicio"),
            modalDetalhe: document.querySelector("#modal-detalhe-receita"),
            fecharDetalhe: document.querySelector("#fechar-detalhe-receita"),
            detalheTitulo: document.querySelector("#detalhe-receita-titulo"),
            detalheCategoria: document.querySelector("#detalhe-receita-categoria"),
            detalheTempo: document.querySelector("#detalhe-receita-tempo"),
            detalhePorcoes: document.querySelector("#detalhe-receita-porcoes"),
            detalheIngredientes: document.querySelector("#detalhe-receita-ingredientes"),
            detalhePreparacao: document.querySelector("#detalhe-receita-preparacao"),
            botaoEditarDetalhe: document.querySelector("#editar-detalhe-receita"),
            botaoFavoritaDetalhe: document.querySelector("#favorita-detalhe-receita"),
            botaoAdicionarCompras: document.querySelector("#adicionar-ingredientes-compras"),
            mensagemCompras: document.querySelector("#mensagem-ingredientes-compras")
        };

        if (!elementos.formulario || !elementos.botaoNovo) {
            return;
        }

        elementos.botaoNovo.addEventListener("click", abrirNovaReceita);
        elementos.botaoVazio?.addEventListener("click", abrirNovaReceita);
        elementos.fecharFormulario.addEventListener("click", fecharModalFormulario);
        elementos.cancelarFormulario.addEventListener("click", fecharModalFormulario);
        elementos.formulario.addEventListener("submit", guardarReceita);
        elementos.lista.addEventListener("click", tratarAcaoLista);
        elementos.pesquisa.addEventListener("input", apresentarReceitasFiltradas);

        elementos.botoesCategoria.forEach(function (botao) {
            botao.addEventListener("click", function () {
                categoriaAtiva = botao.dataset.categoriaReceita;
                elementos.botoesCategoria.forEach(function (outro) {
                    outro.classList.toggle("ativo", outro === botao);
                });
                apresentarReceitasFiltradas();
            });
        });

        elementos.modalFormulario.addEventListener("click", function (evento) {
            if (evento.target === elementos.modalFormulario) {
                fecharModalFormulario();
            }
        });

        elementos.fecharDetalhe.addEventListener("click", fecharModalDetalhe);
        elementos.modalDetalhe.addEventListener("click", function (evento) {
            if (evento.target === elementos.modalDetalhe) {
                fecharModalDetalhe();
            }
        });

        elementos.botaoEditarDetalhe.addEventListener("click", editarReceitaDoDetalhe);
        elementos.botaoFavoritaDetalhe.addEventListener("click", alternarFavoritaDoDetalhe);
        elementos.botaoAdicionarCompras.addEventListener("click", adicionarIngredientesACompras);

        document.addEventListener("keydown", function (evento) {
            if (evento.key !== "Escape") {
                return;
            }

            if (!elementos.modalFormulario.classList.contains("oculto")) {
                fecharModalFormulario();
                return;
            }

            if (!elementos.modalDetalhe.classList.contains("oculto")) {
                fecharModalDetalhe();
            }
        });

        atualizarReceitas();
    }

    function abrirNovaReceita() {
        elementos.formulario.reset();
        elementos.campoId.value = "";
        elementos.campoCategoria.value = "Outras";
        elementos.campoTempo.value = "30";
        elementos.campoPorcoes.value = "2";
        elementos.campoFavorita.checked = false;
        elementos.tituloModal.textContent = "Nova receita";
        mostrarModal(elementos.modalFormulario);
        setTimeout(function () {
            elementos.campoTitulo.focus();
        }, 100);
    }

    async function abrirEdicao(id) {
        try {
            const receita = await window.MinhaVidaDB.obter(
                window.MinhaVidaDB.LOJAS.receitas,
                id
            );

            if (!receita) {
                return;
            }

            elementos.campoId.value = receita.id;
            elementos.campoTitulo.value = receita.titulo || "";
            elementos.campoCategoria.value = receita.categoria || "Outras";
            elementos.campoTempo.value = String(receita.tempoMinutos || 30);
            elementos.campoPorcoes.value = String(receita.porcoes || 2);
            elementos.campoIngredientes.value = receita.ingredientes || "";
            elementos.campoPreparacao.value = receita.preparacao || "";
            elementos.campoFavorita.checked = Boolean(receita.favorita);
            elementos.tituloModal.textContent = "Editar receita";
            mostrarModal(elementos.modalFormulario);
        } catch (erro) {
            console.error(erro);
            alert("Não foi possível abrir a receita.");
        }
    }

    async function guardarReceita(evento) {
        evento.preventDefault();

        const titulo = elementos.campoTitulo.value.trim();
        const tempoMinutos = Number(elementos.campoTempo.value);
        const porcoes = Number(elementos.campoPorcoes.value);

        if (!titulo) {
            alert("Escreve o nome da receita.");
            elementos.campoTitulo.focus();
            return;
        }

        if (!Number.isFinite(tempoMinutos) || tempoMinutos < 1) {
            alert("Escolhe um tempo de preparação válido.");
            elementos.campoTempo.focus();
            return;
        }

        if (!Number.isFinite(porcoes) || porcoes < 1) {
            alert("Escolhe um número de porções válido.");
            elementos.campoPorcoes.focus();
            return;
        }

        const idExistente = elementos.campoId.value;
        let receitaExistente = null;

        if (idExistente) {
            receitaExistente = await window.MinhaVidaDB.obter(
                window.MinhaVidaDB.LOJAS.receitas,
                idExistente
            );
        }

        const receita = {
            id: idExistente || window.MinhaVidaDB.criarId(),
            titulo,
            categoria: elementos.campoCategoria.value,
            tempoMinutos: Math.round(tempoMinutos),
            porcoes: Math.round(porcoes),
            ingredientes: elementos.campoIngredientes.value.trim(),
            preparacao: elementos.campoPreparacao.value.trim(),
            favorita: elementos.campoFavorita.checked,
            dataCriacao: receitaExistente?.dataCriacao || new Date().toISOString()
        };

        const botaoGuardar = elementos.formulario.querySelector('button[type="submit"]');
        botaoGuardar.disabled = true;
        botaoGuardar.textContent = "A guardar…";

        try {
            await window.MinhaVidaDB.guardar(
                window.MinhaVidaDB.LOJAS.receitas,
                receita
            );
            fecharModalFormulario();
            await atualizarReceitas();
        } catch (erro) {
            console.error(erro);
            alert("Não foi possível guardar a receita.");
        } finally {
            botaoGuardar.disabled = false;
            botaoGuardar.textContent = "Guardar";
        }
    }

    async function atualizarReceitas() {
        try {
            receitasGuardadas = await window.MinhaVidaDB.listar(
                window.MinhaVidaDB.LOJAS.receitas
            );

            receitasGuardadas.sort(function (primeira, segunda) {
                if (Boolean(primeira.favorita) !== Boolean(segunda.favorita)) {
                    return primeira.favorita ? -1 : 1;
                }
                return String(primeira.titulo || "").localeCompare(
                    String(segunda.titulo || ""),
                    "pt-PT",
                    { sensitivity: "base" }
                );
            });

            atualizarResumo();
            apresentarReceitasFiltradas();
        } catch (erro) {
            console.error(erro);
            elementos.lista.textContent = "Não foi possível carregar as receitas.";
        }
    }

    function apresentarReceitasFiltradas() {
        const pesquisa = normalizarTexto(elementos.pesquisa.value);

        const filtradas = receitasGuardadas.filter(function (receita) {
            const correspondeCategoria =
                categoriaAtiva === "Todas" || receita.categoria === categoriaAtiva;

            const correspondePesquisa =
                !pesquisa ||
                normalizarTexto(receita.titulo).includes(pesquisa) ||
                normalizarTexto(receita.ingredientes).includes(pesquisa);

            return correspondeCategoria && correspondePesquisa;
        });

        mostrarReceitas(filtradas);
    }

    function mostrarReceitas(filtradas) {
        elementos.lista.replaceChildren();
        const existemReceitas = receitasGuardadas.length > 0;
        const existemResultados = filtradas.length > 0;

        elementos.estadoVazio.classList.toggle("oculto", existemReceitas);
        elementos.semResultados.classList.toggle(
            "oculto",
            !existemReceitas || existemResultados
        );
        elementos.lista.classList.toggle("oculto", !existemResultados);

        filtradas.forEach(function (receita) {
            elementos.lista.appendChild(criarCartaoReceita(receita));
        });
    }

    function atualizarResumo() {
        const favoritas = receitasGuardadas.filter(function (receita) {
            return Boolean(receita.favorita);
        }).length;

        elementos.total.textContent = String(receitasGuardadas.length);
        elementos.totalFavoritas.textContent = String(favoritas);
        elementos.totalInicio.textContent = String(receitasGuardadas.length);
    }

    function criarCartaoReceita(receita) {
        const artigo = document.createElement("article");
        artigo.className = "cartao-receita";

        const icone = document.createElement("div");
        icone.className = "icone-receita";
        icone.textContent = iconeDaCategoria(receita.categoria);

        const informacao = document.createElement("div");
        informacao.className = "informacao-item";

        const titulo = document.createElement("strong");
        titulo.textContent = receita.titulo;

        if (receita.favorita) {
            const favorita = document.createElement("span");
            favorita.className = "receita-favorita";
            favorita.textContent = "♥";
            titulo.append(" ", favorita);
        }

        const resumo = document.createElement("span");
        resumo.textContent = primeiroIngrediente(receita);

        const detalhe = document.createElement("small");
        detalhe.textContent = `${receita.tempoMinutos} min · ${receita.porcoes} porções · ${receita.categoria}`;

        informacao.append(titulo, resumo, detalhe);

        const acoes = document.createElement("div");
        acoes.className = "acoes-item vertical";
        acoes.append(
            criarBotaoAcao("Abrir", "abrir", receita.id),
            criarBotaoAcao("Editar", "editar", receita.id),
            criarBotaoAcao(receita.favorita ? "Desfavoritar" : "Favoritar", "favorita", receita.id),
            criarBotaoAcao("Apagar", "apagar", receita.id, true)
        );

        artigo.append(icone, informacao, acoes);
        return artigo;
    }

    function criarBotaoAcao(texto, acao, id, destrutivo = false) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = texto;
        botao.dataset.acao = acao;
        botao.dataset.id = id;
        if (destrutivo) {
            botao.className = "acao-apagar";
        }
        return botao;
    }

    function primeiroIngrediente(receita) {
        const linhas = linhasDeIngredientes(receita.ingredientes);
        return linhas[0] || "Sem ingredientes adicionados";
    }

    function iconeDaCategoria(categoria) {
        const icones = {
            "Pequeno-almoço": "☕",
            Almoço: "🍽️",
            Jantar: "🌙",
            Sobremesas: "🍰",
            Lanches: "🥪",
            Sopas: "🥣",
            Bebidas: "🥤"
        };
        return icones[categoria] || "🍴";
    }

    async function tratarAcaoLista(evento) {
        const botao = evento.target.closest("button[data-acao]");
        if (!botao) {
            return;
        }

        const id = botao.dataset.id;
        const acao = botao.dataset.acao;

        if (acao === "abrir") {
            await abrirDetalhe(id);
        } else if (acao === "editar") {
            await abrirEdicao(id);
        } else if (acao === "favorita") {
            await alternarFavorita(id);
        } else if (acao === "apagar") {
            await apagarReceita(id);
        }
    }

    async function alternarFavorita(id) {
        try {
            const receita = await window.MinhaVidaDB.obter(
                window.MinhaVidaDB.LOJAS.receitas,
                id
            );

            if (!receita) {
                return;
            }

            receita.favorita = !Boolean(receita.favorita);
            await window.MinhaVidaDB.guardar(
                window.MinhaVidaDB.LOJAS.receitas,
                receita
            );
            await atualizarReceitas();

            if (
                receitaDetalheId === id &&
                !elementos.modalDetalhe.classList.contains("oculto")
            ) {
                preencherDetalhe(receita);
            }
        } catch (erro) {
            console.error(erro);
            alert("Não foi possível alterar a receita.");
        }
    }

    async function apagarReceita(id) {
        if (!confirm("Queres apagar esta receita?")) {
            return;
        }

        try {
            await window.MinhaVidaDB.remover(
                window.MinhaVidaDB.LOJAS.receitas,
                id
            );
            if (receitaDetalheId === id) {
                fecharModalDetalhe();
            }
            await atualizarReceitas();
        } catch (erro) {
            console.error(erro);
            alert("Não foi possível apagar a receita.");
        }
    }

    async function abrirDetalhe(id) {
        try {
            const receita = await window.MinhaVidaDB.obter(
                window.MinhaVidaDB.LOJAS.receitas,
                id
            );
            if (!receita) {
                return;
            }
            receitaDetalheId = id;
            preencherDetalhe(receita);
            mostrarModal(elementos.modalDetalhe);
        } catch (erro) {
            console.error(erro);
            alert("Não foi possível abrir a receita.");
        }
    }

    function preencherDetalhe(receita) {
        elementos.detalheTitulo.textContent = receita.titulo;
        elementos.detalheCategoria.textContent = receita.categoria;
        elementos.detalheTempo.textContent = `${receita.tempoMinutos} min`;
        elementos.detalhePorcoes.textContent = `${receita.porcoes}`;
        elementos.detalheIngredientes.textContent =
            receita.ingredientes || "Ainda não adicionaste ingredientes.";
        elementos.detalhePreparacao.textContent =
            receita.preparacao || "Ainda não adicionaste a preparação.";
        elementos.botaoFavoritaDetalhe.textContent = receita.favorita
            ? "♥ Favorita"
            : "♡ Adicionar aos favoritos";
        elementos.botaoAdicionarCompras.disabled =
            linhasDeIngredientes(receita.ingredientes).length === 0;
        elementos.mensagemCompras.textContent = "";
    }

    async function editarReceitaDoDetalhe() {
        if (!receitaDetalheId) {
            return;
        }
        const id = receitaDetalheId;
        fecharModalDetalhe();
        await abrirEdicao(id);
    }

    async function alternarFavoritaDoDetalhe() {
        if (receitaDetalheId) {
            await alternarFavorita(receitaDetalheId);
        }
    }

    async function adicionarIngredientesACompras() {
        if (!receitaDetalheId) {
            return;
        }

        elementos.mensagemCompras.textContent = "";

        try {
            const receita = await window.MinhaVidaDB.obter(
                window.MinhaVidaDB.LOJAS.receitas,
                receitaDetalheId
            );
            if (!receita) {
                return;
            }

            const ingredientes = linhasDeIngredientes(receita.ingredientes);
            if (ingredientes.length === 0) {
                elementos.mensagemCompras.textContent = "Esta receita não tem ingredientes.";
                return;
            }

            const compras = await window.MinhaVidaDB.listar(
                window.MinhaVidaDB.LOJAS.compras
            );

            const nomesExistentes = new Set(
                compras
                    .filter(function (compra) {
                        return !compra.comprado;
                    })
                    .map(function (compra) {
                        return normalizarTexto(compra.nome);
                    })
            );

            let adicionados = 0;

            for (const ingrediente of ingredientes) {
                const nomeNormalizado = normalizarTexto(ingrediente);
                if (!nomeNormalizado || nomesExistentes.has(nomeNormalizado)) {
                    continue;
                }

                await window.MinhaVidaDB.guardar(
                    window.MinhaVidaDB.LOJAS.compras,
                    {
                        id: window.MinhaVidaDB.criarId(),
                        nome: ingrediente,
                        quantidade: 1,
                        categoria: "Mercearia",
                        supermercado: "Outro",
                        comprado: false,
                        dataCriacao: new Date().toISOString()
                    }
                );

                nomesExistentes.add(nomeNormalizado);
                adicionados += 1;
            }

            elementos.mensagemCompras.textContent =
                adicionados === 0
                    ? "Estes ingredientes já estão na lista."
                    : adicionados === 1
                      ? "Foi adicionado 1 ingrediente."
                      : `Foram adicionados ${adicionados} ingredientes.`;

            await window.MinhaVidaCasa?.atualizar();
        } catch (erro) {
            console.error(erro);
            elementos.mensagemCompras.textContent =
                "Não foi possível adicionar os ingredientes.";
        }
    }

    function linhasDeIngredientes(texto) {
        const nomesUnicos = new Set();
        return String(texto || "")
            .split(/\r?\n/)
            .map(function (linha) {
                return linha
                    .trim()
                    .replace(/^[•\-–—]\s*/, "")
                    .replace(/^\d+[.)]\s*/, "")
                    .trim();
            })
            .filter(function (linha) {
                if (!linha) {
                    return false;
                }
                const normalizado = normalizarTexto(linha);
                if (nomesUnicos.has(normalizado)) {
                    return false;
                }
                nomesUnicos.add(normalizado);
                return true;
            });
    }

    function normalizarTexto(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function mostrarModal(modal) {
        modal.classList.remove("oculto");
        document.body.classList.add("modal-aberto");
    }

    function fecharModalFormulario() {
        elementos.modalFormulario.classList.add("oculto");
        elementos.formulario.reset();
        elementos.campoId.value = "";
        atualizarBloqueioDoCorpo();
    }

    function fecharModalDetalhe() {
        elementos.modalDetalhe.classList.add("oculto");
        receitaDetalheId = null;
        elementos.mensagemCompras.textContent = "";
        atualizarBloqueioDoCorpo();
    }

    function atualizarBloqueioDoCorpo() {
        const existeModalAberto =
            !elementos.modalFormulario.classList.contains("oculto") ||
            !elementos.modalDetalhe.classList.contains("oculto");
        document.body.classList.toggle("modal-aberto", existeModalAberto);
    }

    window.MinhaVidaReceitas = Object.freeze({ atualizar: atualizarReceitas });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciarReceitas);
    } else {
        iniciarReceitas();
    }
})();

(function () {
    "use strict";

    const CHAVE_NOME = "nomePerfil";

    const LOJAS_DADOS = [
        "movimentos",
        "compras",
        "tarefas",
        "prazos",
        "receitas",
        "notas"
    ];

    let elementos = {};

    function iniciarPerfil() {
        elementos = {
            botaoAbrir: document.querySelector("#botao-perfil"),
            modal: document.querySelector("#modal-perfil"),
            botaoFechar: document.querySelector("#fechar-modal-perfil"),
            formulario: document.querySelector("#formulario-perfil"),
            campoNome: document.querySelector("#perfil-nome"),
            saudacao: document.querySelector(".saudacao"),
            botaoExportar: document.querySelector("#exportar-dados"),
            botaoImportar: document.querySelector("#importar-dados"),
            ficheiroImportacao: document.querySelector("#ficheiro-importacao"),
            botaoApagar: document.querySelector("#apagar-todos-dados"),
            mensagem: document.querySelector("#mensagem-perfil")
        };

        if (!elementos.botaoAbrir || !elementos.modal) {
            return;
        }

        elementos.botaoAbrir.addEventListener("click", abrirModal);
        elementos.botaoFechar.addEventListener("click", fecharModal);
        elementos.formulario.addEventListener("submit", guardarPerfil);
        elementos.botaoExportar.addEventListener("click", exportarDados);
        elementos.botaoImportar.addEventListener("click", function () {
            elementos.ficheiroImportacao.click();
        });
        elementos.ficheiroImportacao.addEventListener("change", importarDados);
        elementos.botaoApagar.addEventListener("click", apagarTodosOsDados);
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

        carregarPerfil();
    }

    async function carregarPerfil() {
        try {
            const nome = await window.MinhaVidaDB.lerPreferencia(
                CHAVE_NOME,
                "Alexandra"
            );
            elementos.campoNome.value = nome || "Alexandra";
            atualizarSaudacao(nome || "Alexandra");
        } catch (erro) {
            console.error(erro);
            elementos.campoNome.value = "Alexandra";
            atualizarSaudacao("Alexandra");
        }
    }

    function atualizarSaudacao(nome) {
        elementos.saudacao.textContent = `Olá, ${nome}`;
    }

    function abrirModal() {
        limparMensagem();
        elementos.modal.classList.remove("oculto");
        document.body.classList.add("modal-aberto");
        setTimeout(function () {
            elementos.campoNome.focus();
        }, 100);
    }

    function fecharModal() {
        elementos.modal.classList.add("oculto");
        document.body.classList.remove("modal-aberto");
        limparMensagem();
    }

    async function guardarPerfil(evento) {
        evento.preventDefault();
        const nome = elementos.campoNome.value.trim();

        if (!nome) {
            mostrarMensagem("Escreve o teu nome.", true);
            elementos.campoNome.focus();
            return;
        }

        try {
            await window.MinhaVidaDB.guardarPreferencia(CHAVE_NOME, nome);
            atualizarSaudacao(nome);
            mostrarMensagem("Perfil guardado.");
        } catch (erro) {
            console.error(erro);
            mostrarMensagem("Não foi possível guardar o perfil.", true);
        }
    }

    async function exportarDados() {
        limparMensagem();
        elementos.botaoExportar.disabled = true;
        elementos.botaoExportar.textContent = "A preparar…";

        try {
            const nome = await window.MinhaVidaDB.lerPreferencia(
                CHAVE_NOME,
                "Alexandra"
            );

            const copia = {
                versao: 2,
                criadoEm: new Date().toISOString(),
                perfil: { nome },
                compras: await window.MinhaVidaDB.listar(window.MinhaVidaDB.LOJAS.compras),
                prazos: await window.MinhaVidaDB.listar(window.MinhaVidaDB.LOJAS.prazos),
                movimentos: await window.MinhaVidaDB.listar(window.MinhaVidaDB.LOJAS.movimentos),
                receitas: await window.MinhaVidaDB.listar(window.MinhaVidaDB.LOJAS.receitas),
                tarefasCasa: await window.MinhaVidaDB.listar(window.MinhaVidaDB.LOJAS.tarefas),
                notas: await window.MinhaVidaDB.listar(window.MinhaVidaDB.LOJAS.notas)
            };

            const ficheiro = new Blob([JSON.stringify(copia, null, 2)], {
                type: "application/json;charset=utf-8"
            });

            const endereco = URL.createObjectURL(ficheiro);
            const ligacao = document.createElement("a");
            ligacao.href = endereco;
            ligacao.download = `minha-vida-backup-${dataHoje()}.json`;
            document.body.appendChild(ligacao);
            ligacao.click();
            ligacao.remove();
            URL.revokeObjectURL(endereco);
            mostrarMensagem("Cópia de segurança criada.");
        } catch (erro) {
            console.error(erro);
            mostrarMensagem("Não foi possível criar a cópia.", true);
        } finally {
            elementos.botaoExportar.disabled = false;
            elementos.botaoExportar.textContent = "Exportar dados";
        }
    }

    async function importarDados(evento) {
        limparMensagem();
        const ficheiro = evento.target.files?.[0];
        if (!ficheiro) {
            return;
        }

        try {
            const dados = JSON.parse(await ficheiro.text());
            validarCopiaSeguranca(dados);

            if (!confirm("A importação substituirá os dados atuais. Queres continuar?")) {
                elementos.ficheiroImportacao.value = "";
                return;
            }

            elementos.botaoImportar.disabled = true;
            elementos.botaoImportar.textContent = "A importar…";
            await limparDadosAtuais();
            await importarLista(window.MinhaVidaDB.LOJAS.movimentos, dados.movimentos);
            await importarLista(window.MinhaVidaDB.LOJAS.compras, dados.compras);
            await importarLista(window.MinhaVidaDB.LOJAS.tarefas, dados.tarefasCasa || dados.tarefas);
            await importarLista(window.MinhaVidaDB.LOJAS.prazos, dados.prazos);
            await importarLista(window.MinhaVidaDB.LOJAS.receitas, dados.receitas);
            await importarLista(window.MinhaVidaDB.LOJAS.notas, dados.notas);

            const nomeImportado = dados.perfil?.nome || dados.nome || "Alexandra";
            await window.MinhaVidaDB.guardarPreferencia(CHAVE_NOME, nomeImportado);
            alert("Os dados foram importados com sucesso.");
            window.location.reload();
        } catch (erro) {
            console.error(erro);
            mostrarMensagem("O ficheiro selecionado não é uma cópia válida.", true);
        } finally {
            elementos.botaoImportar.disabled = false;
            elementos.botaoImportar.textContent = "Importar dados";
            elementos.ficheiroImportacao.value = "";
        }
    }

    function validarCopiaSeguranca(dados) {
        if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
            throw new Error("Formato de cópia inválido.");
        }

        const temDadosConhecidos =
            Array.isArray(dados.movimentos) ||
            Array.isArray(dados.compras) ||
            Array.isArray(dados.tarefasCasa) ||
            Array.isArray(dados.tarefas) ||
            Array.isArray(dados.prazos) ||
            Array.isArray(dados.receitas) ||
            Array.isArray(dados.notas) ||
            Boolean(dados.perfil);

        if (!temDadosConhecidos) {
            throw new Error("A cópia não contém dados reconhecidos.");
        }
    }

    async function limparDadosAtuais() {
        for (const nomeLoja of LOJAS_DADOS) {
            await window.MinhaVidaDB.limparLoja(nomeLoja);
        }
        await window.MinhaVidaDB.limparLoja(window.MinhaVidaDB.LOJAS.preferencias);
    }

    async function importarLista(nomeLoja, lista) {
        if (!Array.isArray(lista)) {
            return;
        }

        for (const registoOriginal of lista) {
            if (!registoOriginal || typeof registoOriginal !== "object") {
                continue;
            }

            const registo = { ...registoOriginal };
            if (!registo.id) {
                registo.id = window.MinhaVidaDB.criarId();
            }
            await window.MinhaVidaDB.guardar(nomeLoja, registo);
        }
    }

    async function apagarTodosOsDados() {
        limparMensagem();

        if (!confirm("Queres apagar definitivamente todos os dados da aplicação?")) {
            return;
        }
        if (!confirm("Esta ação não pode ser anulada. Confirmas?")) {
            return;
        }

        elementos.botaoApagar.disabled = true;
        elementos.botaoApagar.textContent = "A apagar…";

        try {
            await limparDadosAtuais();
            alert("Todos os dados foram apagados.");
            window.location.reload();
        } catch (erro) {
            console.error(erro);
            mostrarMensagem("Não foi possível apagar os dados.", true);
            elementos.botaoApagar.disabled = false;
            elementos.botaoApagar.textContent = "Apagar todos os dados";
        }
    }

    function dataHoje() {
        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, "0");
        const dia = String(agora.getDate()).padStart(2, "0");
        return `${ano}-${mes}-${dia}`;
    }

    function mostrarMensagem(texto, erro = false) {
        elementos.mensagem.textContent = texto;
        elementos.mensagem.classList.toggle("erro", erro);
        elementos.mensagem.classList.toggle("sucesso", !erro);
    }

    function limparMensagem() {
        elementos.mensagem.textContent = "";
        elementos.mensagem.classList.remove("erro", "sucesso");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciarPerfil);
    } else {
        iniciarPerfil();
    }
})();

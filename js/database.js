(function () {
    "use strict";

    const NOME_BASE_DADOS = "MinhaVidaDB";
    const VERSAO_BASE_DADOS = 2;

    const LOJAS = Object.freeze({
        movimentos: "movimentos",
        compras: "compras",
        tarefas: "tarefas",
        prazos: "prazos",
        receitas: "receitas",
        notas: "notas",
        preferencias: "preferencias"
    });

    let promessaBaseDados = null;

    function abrirBaseDados() {
        if (promessaBaseDados) {
            return promessaBaseDados;
        }

        promessaBaseDados = new Promise(function (resolver, rejeitar) {
            if (!("indexedDB" in window)) {
                rejeitar(new Error("Este navegador não permite armazenamento local."));
                return;
            }

            const pedido = indexedDB.open(NOME_BASE_DADOS, VERSAO_BASE_DADOS);

            pedido.onupgradeneeded = function (evento) {
                const baseDados = evento.target.result;

                criarLojaSeNecessario(baseDados, LOJAS.movimentos, "id");
                criarLojaSeNecessario(baseDados, LOJAS.compras, "id");
                criarLojaSeNecessario(baseDados, LOJAS.tarefas, "id");
                criarLojaSeNecessario(baseDados, LOJAS.prazos, "id");
                criarLojaSeNecessario(baseDados, LOJAS.receitas, "id");
                criarLojaSeNecessario(baseDados, LOJAS.notas, "id");
                criarLojaSeNecessario(baseDados, LOJAS.preferencias, "chave");
            };

            pedido.onsuccess = function () {
                const baseDados = pedido.result;

                baseDados.onversionchange = function () {
                    baseDados.close();
                    promessaBaseDados = null;
                };

                resolver(baseDados);
            };

            pedido.onerror = function () {
                promessaBaseDados = null;
                rejeitar(pedido.error || new Error("Não foi possível abrir a base de dados."));
            };

            pedido.onblocked = function () {
                promessaBaseDados = null;
                rejeitar(new Error("A base de dados está bloqueada por outra janela."));
            };
        });

        return promessaBaseDados;
    }

    function criarLojaSeNecessario(baseDados, nomeLoja, chave) {
        if (!baseDados.objectStoreNames.contains(nomeLoja)) {
            baseDados.createObjectStore(nomeLoja, { keyPath: chave });
        }
    }

    async function executarOperacao(nomeLoja, modo, operacao) {
        const baseDados = await abrirBaseDados();

        return new Promise(function (resolver, rejeitar) {
            const transacao = baseDados.transaction(nomeLoja, modo);
            const loja = transacao.objectStore(nomeLoja);
            let pedido;
            let resultado;

            try {
                pedido = operacao(loja);
            } catch (erro) {
                rejeitar(erro);
                return;
            }

            if (pedido) {
                pedido.onsuccess = function () {
                    resultado = pedido.result;
                };
            }

            transacao.oncomplete = function () {
                resolver(resultado);
            };

            transacao.onerror = function () {
                rejeitar(
                    transacao.error ||
                    pedido?.error ||
                    new Error("Ocorreu um erro ao guardar os dados.")
                );
            };

            transacao.onabort = function () {
                rejeitar(transacao.error || new Error("A operação foi cancelada."));
            };
        });
    }

    async function guardar(nomeLoja, registo) {
        await executarOperacao(nomeLoja, "readwrite", function (loja) {
            return loja.put(registo);
        });

        return registo;
    }

    function obter(nomeLoja, id) {
        return executarOperacao(nomeLoja, "readonly", function (loja) {
            return loja.get(id);
        });
    }

    async function listar(nomeLoja) {
        const resultado = await executarOperacao(nomeLoja, "readonly", function (loja) {
            return loja.getAll();
        });

        return resultado || [];
    }

    function remover(nomeLoja, id) {
        return executarOperacao(nomeLoja, "readwrite", function (loja) {
            return loja.delete(id);
        });
    }

    function limparLoja(nomeLoja) {
        return executarOperacao(nomeLoja, "readwrite", function (loja) {
            return loja.clear();
        });
    }

    function guardarPreferencia(chave, valor) {
        return guardar(LOJAS.preferencias, { chave: chave, valor: valor });
    }

    async function lerPreferencia(chave, valorPadrao = null) {
        const registo = await obter(LOJAS.preferencias, chave);
        return registo ? registo.valor : valorPadrao;
    }

    function criarId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    window.MinhaVidaDB = Object.freeze({
        LOJAS,
        abrirBaseDados,
        guardar,
        obter,
        listar,
        remover,
        limparLoja,
        guardarPreferencia,
        lerPreferencia,
        criarId
    });
})();

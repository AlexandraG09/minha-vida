"use strict";

const NOME_CACHE = "minha-vida-v5";

const FICHEIROS_APP = [
    "./",
    "./index.html",
    "./manifest.webmanifest",
    "./css/estilos.css?v=5",
    "./js/database.js?v=5",
    "./js/financas.js?v=5",
    "./js/casa.js?v=5",
    "./js/tarefas.js?v=5",
    "./js/prazos.js?v=5",
    "./js/receitas.js?v=5",
    "./js/notas.js?v=5",
    "./js/perfil.js?v=5",
    "./js/app.js?v=5"
];

self.addEventListener("install", function (evento) {
    evento.waitUntil(
        caches
            .open(NOME_CACHE)
            .then(function (cache) {
                return cache.addAll(FICHEIROS_APP);
            })
            .then(function () {
                return self.skipWaiting();
            })
    );
});

self.addEventListener("activate", function (evento) {
    evento.waitUntil(
        caches
            .keys()
            .then(function (nomesCaches) {
                return Promise.all(
                    nomesCaches
                        .filter(function (nome) {
                            return nome !== NOME_CACHE;
                        })
                        .map(function (nome) {
                            return caches.delete(nome);
                        })
                );
            })
            .then(function () {
                return self.clients.claim();
            })
    );
});

self.addEventListener("fetch", function (evento) {
    const pedido = evento.request;

    if (pedido.method !== "GET") {
        return;
    }

    const endereco = new URL(pedido.url);

    if (endereco.origin !== self.location.origin) {
        return;
    }

    evento.respondWith(
        fetch(pedido)
            .then(function (resposta) {
                if (resposta && resposta.ok) {
                    const copia = resposta.clone();

                    caches
                        .open(NOME_CACHE)
                        .then(function (cache) {
                            cache.put(pedido, copia);
                        });
                }

                return resposta;
            })
            .catch(function () {
                return caches
                    .match(pedido)
                    .then(function (respostaGuardada) {
                        if (respostaGuardada) {
                            return respostaGuardada;
                        }

                        return caches.match(
                            pedido,
                            {
                                ignoreSearch: true
                            }
                        );
                    });
            })
    );
});

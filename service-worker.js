"use strict";

const NOME_CACHE = "minha-vida-v1";

const FICHEIROS_APP = [
    "./",
    "./index.html",
    "./manifest.webmanifest",
    "./css/estilos.css",
    "./js/database.js",
    "./js/financas.js",
    "./js/casa.js",
    "./js/tarefas.js",
    "./js/prazos.js",
    "./js/receitas.js",
    "./js/perfil.js",
    "./js/app.js"
];

self.addEventListener(
    "install",
    function (evento) {
        evento.waitUntil(
            caches
                .open(NOME_CACHE)
                .then(function (cache) {
                    return cache.addAll(
                        FICHEIROS_APP
                    );
                })
                .then(function () {
                    return self.skipWaiting();
                })
        );
    }
);

self.addEventListener(
    "activate",
    function (evento) {
        evento.waitUntil(
            caches
                .keys()
                .then(function (nomesCaches) {
                    return Promise.all(
                        nomesCaches
                            .filter(function (nome) {
                                return nome !==
                                    NOME_CACHE;
                            })
                            .map(function (nome) {
                                return caches.delete(
                                    nome
                                );
                            })
                    );
                })
                .then(function () {
                    return self.clients.claim();
                })
        );
    }
);

self.addEventListener(
    "fetch",
    function (evento) {
        const pedido = evento.request;

        if (pedido.method !== "GET") {
            return;
        }

        const endereco = new URL(
            pedido.url
        );

        if (
            endereco.origin !==
            self.location.origin
        ) {
            return;
        }

        if (pedido.mode === "navigate") {
            evento.respondWith(
                fetch(pedido)
                    .then(function (resposta) {
                        const copia =
                            resposta.clone();

                        caches
                            .open(NOME_CACHE)
                            .then(function (cache) {
                                cache.put(
                                    "./index.html",
                                    copia
                                );
                            });

                        return resposta;
                    })
                    .catch(function () {
                        return caches.match(
                            "./index.html"
                        );
                    })
            );

            return;
        }

        evento.respondWith(
            caches
                .match(pedido)
                .then(function (
                    respostaGuardada
                ) {
                    if (respostaGuardada) {
                        return respostaGuardada;
                    }

                    return fetch(pedido)
                        .then(function (resposta) {
                            if (
                                !resposta ||
                                !resposta.ok
                            ) {
                                return resposta;
                            }

                            const copia =
                                resposta.clone();

                            caches
                                .open(NOME_CACHE)
                                .then(function (cache) {
                                    cache.put(
                                        pedido,
                                        copia
                                    );
                                });

                            return resposta;
                        });
                })
        );
    }
);
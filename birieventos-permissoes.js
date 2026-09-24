// BiriEventos - Controle central de permissões - 2026-09-24
(function () {
  "use strict";

  const SUPABASE_URL = "https://ekfmnkvkkqivpcsaxzzj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_HLpemwHF_YvYrEL3CTpm3w_mD9zPgeI";

  const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    }
  );

  const TODOS = [
    "ADMINISTRADOR",
    "OPERADOR",
    "CONSULTA",
    "SOLICITANTE"
  ];

  const ROTAS = {
    "dashboard.html": [
      "ADMINISTRADOR",
      "OPERADOR",
      "CONSULTA"
    ],

    "materiais.html": [
      "ADMINISTRADOR",
      "OPERADOR",
      "CONSULTA"
    ],

    "eventos.html": [
      "ADMINISTRADOR",
      "OPERADOR",
      "CONSULTA"
    ],

    "emprestimos.html": [
      "ADMINISTRADOR",
      "OPERADOR",
      "CONSULTA"
    ],

    "devolucoes.html": [
      "ADMINISTRADOR",
      "OPERADOR",
      "CONSULTA"
    ],

    "solicitacoes.html": TODOS,
    "solicitacoes(1).html": TODOS,

    "aprovacoes.html": [
      "ADMINISTRADOR"
    ],

    "usuarios.html": [
      "ADMINISTRADOR"
    ],

    "relatorios.html": [
      "ADMINISTRADOR",
      "OPERADOR",
      "CONSULTA"
    ]
  };

  const paginaAtual =
    (location.pathname.split("/").pop() || "index.html")
      .toLowerCase();

  let nivelAtual = "";
  let observerInstalado = false;

  function nomePagina(valor) {
    try {
      return (
        new URL(valor, location.href)
          .pathname
          .split("/")
          .pop() || ""
      ).toLowerCase();
    } catch (erro) {
      return "";
    }
  }

  function esconder(elemento) {
    elemento.hidden = true;
    elemento.setAttribute("aria-hidden", "true");
  }

  function mostrar(elemento) {
    elemento.hidden = false;
    elemento.removeAttribute("aria-hidden");
    elemento.classList.remove("oculto");
  }

  function esconderTudo(seletor) {
    document
      .querySelectorAll(seletor)
      .forEach(esconder);
  }

  function atualizarIdentificacao(perfil, usuario) {
    const nivelInformado = String(
      perfil.nivel_acesso || ""
    )
      .trim()
      .toUpperCase();

    const nivel = TODOS.includes(nivelInformado)
      ? nivelInformado
      : "SOLICITANTE";

    const email = String(
      perfil.email ||
      usuario.email ||
      "USUÁRIO"
    )
      .trim()
      .toLocaleUpperCase("pt-BR");

    const nome = String(
      perfil.nome ||
      perfil.email ||
      usuario.email ||
      "U"
    ).trim();

    nivelAtual = nivel;
    window.BiriEventosPerfil = perfil;

    // Mantém o perfil no atributo do <html> para uso em CSS.
    document.documentElement.dataset.birieventosNivel =
      nivel;

    // Atualiza somente elementos dentro do <body>.
    // O seletor global também encontrava o <html> e apagava a página.
    document.body
      .querySelectorAll(
        ".usuario-nivel, .nivel, #nivel, [data-birieventos-nivel]"
      )
      .forEach(elemento => {
        elemento.textContent = nivel;
      });

    document
      .querySelectorAll(
        ".usuario-email, .email, .email-menu, [data-birieventos-email]"
      )
      .forEach(elemento => {
        elemento.textContent = email;
      });

    document
      .querySelectorAll(
        ".usuario-avatar, .avatar, [data-birieventos-avatar]"
      )
      .forEach(elemento => {
        elemento.textContent =
          nome.charAt(0).toLocaleUpperCase("pt-BR") || "U";
      });

    ajustarMenu(nivel);
    aplicarBloqueios(nivel);
  }

  function ajustarMenu(nivel) {
    document
      .querySelectorAll("a[href]")
      .forEach(link => {
        const alvo = nomePagina(
          link.getAttribute("href")
        );

        if (!ROTAS[alvo]) {
          return;
        }

        if (ROTAS[alvo].includes(nivel)) {
          mostrar(link);
        } else {
          esconder(link);
        }
      });
  }

  function aplicarBloqueios(nivel) {
    const administrador =
      nivel === "ADMINISTRADOR";

    const consulta =
      nivel === "CONSULTA";

    if (
      paginaAtual === "materiais.html" &&
      !administrador
    ) {
      esconderTudo(
        "#botaoNovo, .material-card .menu-acoes, .material-card .acao, #salvar"
      );
    }

    if (
      paginaAtual === "eventos.html" &&
      !administrador
    ) {
      esconderTudo(
        "#botaoNovo, .acoes, #salvar"
      );
    }

    if (
      paginaAtual === "emprestimos.html" &&
      consulta
    ) {
      esconderTudo(
        "#novo, .emprestimo .acoes, #salvar"
      );
    }

    if (
      paginaAtual === "devolucoes.html" &&
      consulta
    ) {
      esconderTudo(
        ".devolucao .acao, #salvar"
      );
    }

    if (
      (
        paginaAtual === "solicitacoes.html" ||
        paginaAtual === "solicitacoes(1).html"
      ) &&
      consulta
    ) {
      esconderTudo(
        "#botaoNovo, #salvar, .solicitacao .acoes, .item-form .remover"
      );
    }
  }

  function iniciarObservador() {
    if (
      observerInstalado ||
      !document.body
    ) {
      return;
    }

    observerInstalado = true;

    const observer =
      new MutationObserver(() => {
        if (nivelAtual) {
          ajustarMenu(nivelAtual);
          aplicarBloqueios(nivelAtual);
        }
      });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    aplicarBloqueios(nivelAtual);
  }

  function irParaAcessoNegado(nivel) {
    const destino =
      nivel === "SOLICITANTE"
        ? "solicitacoes.html"
        : "dashboard.html";

    if (paginaAtual !== destino) {
      alert(
        "SEU PERFIL NÃO TEM ACESSO A ESTA PÁGINA."
      );

      location.replace(destino);
    }
  }

  async function protegerPagina() {
    if (!ROTAS[paginaAtual]) {
      return;
    }

    const {
      data: sessao,
      error: erroSessao
    } = await db.auth.getSession();

    if (
      erroSessao ||
      !sessao.session
    ) {
      location.replace("index.html");
      return;
    }

    const usuario =
      sessao.session.user;

    const {
      data: perfil,
      error: erroPerfil
    } = await db
      .from("perfis")
      .select("id,nome,email,nivel_acesso,ativo")
      .eq("id", usuario.id)
      .single();

    if (
      erroPerfil ||
      !perfil ||
      !perfil.ativo
    ) {
      await db.auth.signOut();

      alert(
        "USUÁRIO SEM PERFIL ATIVO."
      );

      location.replace("index.html");
      return;
    }

    const nivel =
      String(perfil.nivel_acesso || "")
        .trim()
        .toUpperCase();

    if (
      !ROTAS[paginaAtual].includes(nivel)
    ) {
      irParaAcessoNegado(nivel);
      return;
    }

    atualizarIdentificacao(
      perfil,
      usuario
    );

    iniciarObservador();
  }

  function prepararDom() {
    iniciarObservador();
  }

  function iniciarPermissoes() {
    prepararDom();

    protegerPagina().catch(erro => {
      console.error(
        "Falha ao validar permissões do BiriEventos:",
        erro
      );

      location.replace("index.html");
    });
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      iniciarPermissoes,
      { once: true }
    );
  } else {
    iniciarPermissoes();
  }
})();

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
  let notificacoesIniciadas = false;
  let verificacaoNotificacoesAtiva = false;

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

    // Mantém o perfil no atributo do <html> para uso em CSS,
    // mas não altera o textContent do documento inteiro.
    document.documentElement.dataset.birieventosNivel =
      nivel;

    // Busca apenas dentro do <body>. O seletor global
    // [data-birieventos-nivel] também encontra o próprio <html>
    // e substituir seu textContent apaga toda a página.
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

  function instalarEstilosNotificacao() {
    if (document.getElementById("birieventos-notificacao-estilos")) {
      return;
    }

    const estilo = document.createElement("style");
    estilo.id = "birieventos-notificacao-estilos";
    estilo.textContent = `
      .birieventos-notificacao-badge {
        min-width: 22px;
        height: 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-left: auto;
        padding: 0 6px;
        border-radius: 999px;
        color: #fff;
        background: #dc2626;
        box-shadow: 0 2px 8px rgba(220, 38, 38, .35);
        font-size: 11px;
        font-weight: 900;
        line-height: 1;
      }
      .birieventos-notificacao-area {
        position: fixed;
        top: 18px;
        right: 18px;
        z-index: 10050;
        display: grid;
        gap: 10px;
        width: min(390px, calc(100vw - 32px));
        pointer-events: none;
      }
      .birieventos-notificacao-toast {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 15px 16px;
        border: 1px solid #bfdbfe;
        border-left: 5px solid #2563eb;
        border-radius: 13px;
        color: #1e293b;
        background: #fff;
        box-shadow: 0 14px 40px rgba(15, 23, 42, .2);
        animation: birieventos-notificacao-entrada .22s ease-out;
        pointer-events: auto;
      }
      .birieventos-notificacao-icone {
        width: 38px;
        height: 38px;
        flex: 0 0 auto;
        display: grid;
        place-items: center;
        border-radius: 11px;
        color: #1d4ed8;
        background: #eff6ff;
        font-size: 19px;
      }
      .birieventos-notificacao-conteudo {
        flex: 1;
        color: inherit;
        text-decoration: none;
      }
      .birieventos-notificacao-conteudo strong {
        display: block;
        font-size: 13px;
        line-height: 1.35;
      }
      .birieventos-notificacao-conteudo span {
        display: block;
        margin-top: 4px;
        color: #64748b;
        font-size: 12px;
        line-height: 1.45;
      }
      .birieventos-notificacao-fechar {
        width: 28px;
        height: 28px;
        flex: 0 0 auto;
        border: 0;
        border-radius: 8px;
        color: #64748b;
        background: #f1f5f9;
        font-size: 18px;
        cursor: pointer;
      }
      .birieventos-notificacao-fechar:hover {
        color: #0f172a;
        background: #e2e8f0;
      }
      @keyframes birieventos-notificacao-entrada {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (max-width: 520px) {
        .birieventos-notificacao-area { top: 10px; right: 10px; width: calc(100vw - 20px); }
      }
    `;
    document.head.appendChild(estilo);
  }

  function obterAreaNotificacao() {
    let area = document.getElementById("birieventos-notificacao-area");
    if (!area) {
      area = document.createElement("div");
      area.id = "birieventos-notificacao-area";
      area.className = "birieventos-notificacao-area";
      area.setAttribute("aria-live", "polite");
      area.setAttribute("aria-atomic", "false");
      document.body.appendChild(area);
    }
    return area;
  }

  function atualizarBadgeSolicitacoes(quantidade) {
    const link = Array.from(document.querySelectorAll("a[href]"))
      .find(item => nomePagina(item.getAttribute("href")) === "aprovacoes.html");

    if (!link) {
      return;
    }

    let badge = link.querySelector(".birieventos-notificacao-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "birieventos-notificacao-badge";
      link.appendChild(badge);
    }

    const total = Number(quantidade || 0);
    badge.textContent = total > 99 ? "99+" : String(total);
    badge.title = `${total} solicitação(ões) aguardando aprovação`;
    badge.setAttribute("aria-label", badge.title);
    badge.hidden = total === 0;
  }

  function chaveSolicitacoesNotificadas() {
    const id = window.BiriEventosPerfil?.id || "administrador";
    return `birieventos:solicitacoes-observadas:${id}`;
  }

  function notificacoesIniciadasNestaAba() {
    try {
      return sessionStorage.getItem("birieventos:solicitacoes-inicializadas") === "1";
    } catch (erro) {
      return false;
    }
  }

  function marcarNotificacoesIniciadasNestaAba() {
    try {
      sessionStorage.setItem("birieventos:solicitacoes-inicializadas", "1");
    } catch (erro) {
      // O aviso e o contador não dependem do sessionStorage.
    }
  }

  function lerSolicitacoesObservadas() {
    try {
      const valor = JSON.parse(localStorage.getItem(chaveSolicitacoesNotificadas()) || "[]");
      return new Set(Array.isArray(valor) ? valor.map(String) : []);
    } catch (erro) {
      return new Set();
    }
  }

  function salvarSolicitacoesObservadas(ids) {
    try {
      localStorage.setItem(
        chaveSolicitacoesNotificadas(),
        JSON.stringify(Array.from(ids).slice(-500))
      );
    } catch (erro) {
      // A notificação visual continua funcionando mesmo sem armazenamento local.
    }
  }

  function mostrarToastSolicitacao(titulo, descricao) {
    instalarEstilosNotificacao();
    const area = obterAreaNotificacao();
    const toast = document.createElement("div");
    toast.className = "birieventos-notificacao-toast";
    toast.setAttribute("role", "status");

    const icone = document.createElement("div");
    icone.className = "birieventos-notificacao-icone";
    icone.textContent = "🔔";

    const link = document.createElement("a");
    link.className = "birieventos-notificacao-conteudo";
    link.href = "aprovacoes.html";

    const textoTitulo = document.createElement("strong");
    textoTitulo.textContent = titulo;
    const textoDescricao = document.createElement("span");
    textoDescricao.textContent = descricao;
    link.append(textoTitulo, textoDescricao);

    const fechar = document.createElement("button");
    fechar.className = "birieventos-notificacao-fechar";
    fechar.type = "button";
    fechar.setAttribute("aria-label", "Fechar notificação");
    fechar.textContent = "×";
    fechar.onclick = () => toast.remove();

    toast.append(icone, link, fechar);
    area.appendChild(toast);
    window.setTimeout(() => toast.remove(), 12000);
  }

  async function verificarSolicitacoesPendentes() {
    if (
      nivelAtual !== "ADMINISTRADOR" ||
      verificacaoNotificacoesAtiva
    ) {
      return;
    }

    verificacaoNotificacoesAtiva = true;

    try {
      const { data, error } = await db
        .from("solicitacoes_reserva")
        .select("id,evento_nome,criado_em")
        .eq("status", "AGUARDANDO_APROVACAO")
        .order("criado_em", { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      const pendentes = Array.isArray(data) ? data : [];
      atualizarBadgeSolicitacoes(pendentes.length);

      const observadas = lerSolicitacoesObservadas();
      const novas = pendentes.filter(item => item.id && !observadas.has(String(item.id)));
      novas.forEach(item => observadas.add(String(item.id)));
      salvarSolicitacoesObservadas(observadas);

      if (novas.length === 1) {
        const evento = String(novas[0].evento_nome || "EVENTO").trim();
        mostrarToastSolicitacao(
          "NOVA SOLICITAÇÃO RECEBIDA",
          `O consultor solicitou materiais para: ${evento}. Toque para analisar.`
        );
      } else if (novas.length > 1) {
        mostrarToastSolicitacao(
          "NOVAS SOLICITAÇÕES RECEBIDAS",
          `${novas.length} solicitações novas aguardam sua análise. Toque para abrir Aprovações.`
        );
      } else if (!notificacoesIniciadasNestaAba() && pendentes.length) {
        mostrarToastSolicitacao(
          "SOLICITAÇÕES AGUARDANDO",
          `Há ${pendentes.length} solicitação(ões) pendente(s) de aprovação. Toque para analisar.`
        );
      }

      marcarNotificacoesIniciadasNestaAba();
    } catch (erro) {
      console.warn("Não foi possível verificar novas solicitações:", erro);
    } finally {
      verificacaoNotificacoesAtiva = false;
    }
  }

  function iniciarNotificacoesSolicitacoes() {
    if (notificacoesIniciadas || nivelAtual !== "ADMINISTRADOR") {
      return;
    }

    notificacoesIniciadas = true;
    instalarEstilosNotificacao();
    verificarSolicitacoesPendentes();
    window.setInterval(verificarSolicitacoesPendentes, 15000);
    window.addEventListener("focus", verificarSolicitacoesPendentes);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        verificarSolicitacoesPendentes();
      }
    });
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
    iniciarNotificacoesSolicitacoes();
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

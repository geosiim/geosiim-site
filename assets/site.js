// Comportamento da página inicial — menu, seção ativa e formulário de contato.
// Mesma lógica do componente do Claude Design, sem React.
(() => {
'use strict';

// Endpoint do formulário de contato (POST com FormData, resposta 2xx = enviado).
// Vazio: o envio abre o programa de e-mail do visitante com a mensagem pronta,
// endereçada a EMAIL_CONTATO. Preencher quando houver um serviço de formulários.
const FORM_ENDPOINT = '';
const EMAIL_CONTATO = 'contato@geosiim.com';

const SECTIONS = ['sobre', 'solucoes', 'beneficios', 'contato'];
const FIELDS = ['nome', 'email', 'telefone', 'prefeitura', 'cargo', 'mensagem', 'consentimento'];
const ROTULOS = { nome: 'Nome', email: 'E-mail', telefone: 'Telefone', prefeitura: 'Prefeitura', cargo: 'Cargo' };

function validate(name, v) {
  const t = typeof v === 'string' ? v.trim() : v;
  switch (name) {
    case 'nome': return t && t.length >= 2 ? '' : 'Informe o seu nome.';
    case 'email': return !t ? 'Informe o seu e-mail.' : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t) ? '' : 'Informe um e-mail válido, por exemplo nome@prefeitura.sp.gov.br.';
    case 'telefone': { if (!t) return ''; const n = t.replace(/\D/g, '').length; return n >= 10 && n <= 11 ? '' : 'Informe o telefone com DDD, por exemplo (11) 3000-0000.'; }
    case 'prefeitura': return t ? '' : 'Informe a prefeitura.';
    case 'cargo': return t ? '' : 'Informe o seu cargo.';
    case 'mensagem': return t && t.length >= 10 ? '' : 'Escreva uma mensagem com pelo menos 10 caracteres.';
    case 'consentimento': return v ? '' : 'Marque a autorização para podermos entrar em contato.';
    default: return '';
  }
}

// ── Ano do rodapé ──
document.querySelectorAll('footer [style*="tabular-nums"]').forEach((el) => {
  if (/^\d{4}$/.test(el.textContent.trim())) el.textContent = String(new Date().getFullYear());
});

// ── Menu (painel deslizante abaixo de 900 px) ──
const lista = document.getElementById('menu-principal');
const botaoMenu = document.querySelector('[data-menubtn]');
const fundo = document.querySelector('[data-backdrop]');
const iconeFechado = document.querySelector('[data-icone-fechado]');
const iconeAberto = document.querySelector('[data-icone-aberto]');

function setMenu(aberto) {
  const v = aberto ? 'true' : 'false';
  lista.dataset.open = v;
  fundo.dataset.open = v;
  botaoMenu.setAttribute('aria-expanded', v);
  iconeFechado.hidden = aberto;
  iconeAberto.hidden = !aberto;
}
botaoMenu.addEventListener('click', () => setMenu(lista.dataset.open !== 'true'));
fundo.addEventListener('click', () => setMenu(false));
lista.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && lista.dataset.open === 'true') { setMenu(false); botaoMenu.focus(); }
});

// ── Destaca no menu a seção que ocupa a faixa central da tela ──
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      lista.querySelectorAll('a').forEach((a) => {
        a.setAttribute('aria-current', a.getAttribute('href') === '#' + en.target.id ? 'location' : 'false');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  SECTIONS.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
}

// ── Formulário de contato ──
const form = document.getElementById('form-contato');
const blocoForm = document.querySelector('[data-formulario]');
const blocoSucesso = document.querySelector('[data-sucesso]');
const tituloSucesso = document.getElementById('titulo-sucesso');
const textoSucesso = tituloSucesso.nextElementSibling;
const aviso = document.querySelector('[data-aviso]');
const botaoEnviar = form.querySelector('button[type="submit"]');
const rotuloEnviar = botaoEnviar.querySelector('span');
const TEXTO_SUCESSO = { titulo: tituloSucesso.textContent, texto: textoSucesso.textContent };
let tentou = false;

function mostrarErro(name, msg) {
  const el = form.elements[name];
  el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (el.type !== 'checkbox') el.style.borderColor = msg ? '#eb6834' : '#FFFFFF';
  document.getElementById('err-' + name).textContent = msg;
}
function mostrarAviso(texto) {
  aviso.hidden = !texto;
  aviso.firstElementChild.textContent = texto;
}
function setEnviando(sim) {
  botaoEnviar.disabled = sim;
  form.setAttribute('aria-busy', sim ? 'true' : 'false');
  rotuloEnviar.textContent = sim ? 'Enviando…' : 'Enviar';
}
function valorDe(fd, k) { return k === 'consentimento' ? fd.get(k) === 'sim' : (fd.get(k) || ''); }

// Revalida o campo ao sair dele ou digitar, mas só depois da primeira tentativa de envio.
function aoMudar(e) {
  if (!tentou || !FIELDS.includes(e.target.name)) return;
  const el = e.target;
  mostrarErro(el.name, validate(el.name, el.type === 'checkbox' ? el.checked : el.value));
}
form.addEventListener('input', aoMudar);
form.addEventListener('change', aoMudar);
form.addEventListener('focusout', aoMudar);

function mostrarSucesso(titulo, texto) {
  tituloSucesso.textContent = titulo;
  textoSucesso.textContent = texto;
  blocoForm.hidden = true;
  blocoSucesso.hidden = false;
  tituloSucesso.focus(); // leitores de tela anunciam a confirmação
}

function abrirEmail(fd) {
  const linhas = Object.keys(ROTULOS).filter((k) => fd.get(k)).map((k) => ROTULOS[k] + ': ' + fd.get(k).trim());
  const corpo = linhas.join('\n') + '\n\n' + fd.get('mensagem').trim();
  const assunto = 'Contato pelo site: ' + fd.get('prefeitura').trim();
  window.location.href = 'mailto:' + EMAIL_CONTATO + '?subject=' + encodeURIComponent(assunto) + '&body=' + encodeURIComponent(corpo);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  if (fd.get('website')) { mostrarSucesso(TEXTO_SUCESSO.titulo, TEXTO_SUCESSO.texto); return; } // honeypot preenchido: finge sucesso e descarta
  tentou = true;
  const ruins = FIELDS.filter((k) => { const msg = validate(k, valorDe(fd, k)); mostrarErro(k, msg); return msg; });
  if (ruins.length) {
    mostrarAviso(ruins.length === 1 ? 'Revise o campo indicado.' : 'Revise os ' + ruins.length + ' campos indicados.');
    form.elements[ruins[0]].focus();
    return;
  }
  mostrarAviso('');
  fd.delete('website');

  if (!FORM_ENDPOINT) {
    abrirEmail(fd);
    mostrarSucesso('Mensagem pronta', 'Abrimos o seu programa de e-mail com a mensagem preenchida. Basta enviar. Se nada abriu, escreva para ' + EMAIL_CONTATO + '.');
    return;
  }

  setEnviando(true);
  try {
    const r = await fetch(FORM_ENDPOINT, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    form.reset();
    tentou = false;
    mostrarSucesso(TEXTO_SUCESSO.titulo, TEXTO_SUCESSO.texto);
  } catch (err) {
    mostrarAviso('Não foi possível enviar agora. Tente novamente em instantes ou escreva para ' + EMAIL_CONTATO + '.');
  } finally {
    setEnviando(false);
  }
});

// "Enviar outra mensagem"
blocoSucesso.querySelector('button').addEventListener('click', () => {
  tentou = false;
  FIELDS.forEach((k) => mostrarErro(k, ''));
  mostrarAviso('');
  blocoSucesso.hidden = true;
  blocoForm.hidden = false;
  form.elements.nome.focus();
});
})();

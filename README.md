# geosiim-site

Site institucional do **GEOSIIM Cidades Inteligentes**, publicado em
**https://www.geosiim.com** pelo GitHub Pages.

A plataforma em si (o SaaS) fica em **https://app.geosiim.com** e vive em
outro repositório (`geosiim/geosiim`). Este repositório contém apenas a
página de apresentação.

## Estrutura

| Arquivo | Função |
|---|---|
| `index.html` | A página única do site (design do Claude Design, em HTML estático) |
| `assets/site.js` | Menu mobile, seção ativa no menu e formulário de contato |
| `assets/geosiim-dashboard.js` | Painel animado do topo (web component, sem dependências) |
| `assets/industry.css` | Design system Industry com a paleta GEOSIIM |
| `fonts/` | Barlow, Barlow Condensed e IBM Plex Mono (servidas localmente) |
| `og-image.png` | Imagem de compartilhamento (1200×630) |
| `404.html` | Página de erro do Pages |
| `CNAME` | Domínio personalizado: `www.geosiim.com` |
| `.nojekyll` | Desliga o Jekyll; os arquivos são servidos como estão |
| `robots.txt`, `sitemap.xml` | Indexação em buscadores |
| `.github/workflows/pages.yml` | Publica a cada push na `main` |

Não há etapa de build nem dependência externa (CDN, Google Fonts): o que
está no repositório é o que vai ao ar.

### Sobre a conversão do design

O export do Claude Design (`*.dc.html`) é montado no navegador por um runtime
que baixa React do unpkg. Para produção a página foi convertida em HTML
estático equivalente: os `{{ bindings }}` viraram valores fixos, os `sc-if`
viraram elementos com `hidden`, os atributos `style-hover`/`style-focus`
viraram classes CSS, e a lógica do componente foi para `assets/site.js`.
O conteúdo aparece sem esperar JavaScript e fica legível para buscadores.

Ao trazer uma nova versão do design, repita a conversão (ou peça ao Claude
Code) em vez de copiar o `.dc.html` direto.

## Configuração (uma vez)

### 1. GitHub Pages

Em **Settings → Pages** deste repositório:

1. **Source:** `GitHub Actions`.
2. **Custom domain:** `www.geosiim.com` → Save.
3. Depois que o DNS propagar e o certificado for emitido, marque
   **Enforce HTTPS**.

> Recomendado: verificar o domínio em **Settings (da conta) → Pages →
> Verified domains**. Isso impede que outro repositório do GitHub
> reivindique `geosiim.com` se a configuração do Pages for removida.
> O GitHub mostra um registro TXT para cadastrar na Hostinger.

### 2. DNS na Hostinger

Em **hPanel → Domínios → geosiim.com → DNS / Nameservers → Gerenciar
registros DNS**. Só se mexe em dois nomes: `www` e `@`.

**`www`** — já existe um `CNAME www → geosiim.com`. Um nome só pode ter um
CNAME, então **edite esse registro** (ou apague e recrie) trocando o destino:

| Tipo | Nome | Aponta para | TTL |
|---|---|---|---|
| `CNAME` | `www` | `geosiim.github.io` | 3600 |

**`@`** — apague os registros `A`/`AAAA` de `@` que apontam para a Hostinger
(estacionamento) e crie:

| Tipo | Nome | Aponta para | TTL |
|---|---|---|---|
| `A` | `@` | `185.199.108.153` | 3600 |
| `A` | `@` | `185.199.109.153` | 3600 |
| `A` | `@` | `185.199.110.153` | 3600 |
| `A` | `@` | `185.199.111.153` | 3600 |
| `AAAA` | `@` | `2606:50c0:8000::153` | 3600 |
| `AAAA` | `@` | `2606:50c0:8001::153` | 3600 |
| `AAAA` | `@` | `2606:50c0:8002::153` | 3600 |
| `AAAA` | `@` | `2606:50c0:8003::153` | 3600 |

Os registros de `@` fazem `geosiim.com` (sem www) redirecionar
automaticamente para `www.geosiim.com`.

> **Não altere** os registros `MX`, `TXT` (SPF, DKIM, DMARC) nem os
> `CNAME` de e-mail (`autodiscover`, `autoconfig`, etc.): eles mantêm o
> `contato@geosiim.com` funcionando e são independentes do site.

**Não** crie registro para `app` ainda — ele será apontado para o servidor
da aplicação (ver abaixo).

Conferir a propagação:

```bash
dig www.geosiim.com +short   # deve mostrar geosiim.github.io e os IPs 185.199.x
dig geosiim.com +short       # os quatro 185.199.10x.153
```

## Conteúdo e decisões

- **Formulário de contato**: sem servidor, o botão Enviar abre o programa de
  e-mail do visitante com a mensagem pronta, endereçada a
  `contato@geosiim.com`. Quando houver backend, preencha `FORM_ENDPOINT` em
  `assets/site.js` (POST com FormData; resposta 2xx = enviado).
- **Política de Privacidade e Termos de Uso**: ainda não existem; os links
  foram retirados do formulário e do rodapé. Ao publicá-los, recolocar o link
  ao lado da autorização de contato (LGPD) e no rodapé.
- **CNPJ e endereço** no rodapé: retirados até haver os dados oficiais.

Para testar localmente:

```bash
python3 -m http.server 8080   # abre em http://localhost:8080
```

## E o app.geosiim.com?

O `app.geosiim.com` **não** pode ir para o GitHub Pages. A aplicação precisa
de PostgreSQL/PostGIS, da API FastAPI e do MinIO, e o frontend chama a API
por caminho relativo (`/api`) na **mesma origem** — requisito de segurança
do cookie HttpOnly de refresh (S-10). O desenho é:

```
www.geosiim.com  →  GitHub Pages (este repositório)
app.geosiim.com  →  servidor com Docker (VPS)
                     ├─ proxy reverso com HTTPS (Caddy/nginx)
                     ├─ /       → build estático do frontend (vite build)
                     └─ /api/*  → API FastAPI (porta 8000)
```

Quando o servidor existir, basta um registro `A` `app` → IP do servidor na
Hostinger.

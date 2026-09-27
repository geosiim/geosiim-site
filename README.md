# geosiim-site

Site institucional do **GEOSIIM Cidades Inteligentes**, publicado em
**https://www.geosiim.com** pelo GitHub Pages.

A plataforma em si (o SaaS) fica em **https://app.geosiim.com** e vive em
outro repositório (`geosiim/geosiim`). Este repositório contém apenas a
página de apresentação.

## Estrutura

| Arquivo | Função |
|---|---|
| `index.html` | A página única do site (design do Claude Design) |
| `404.html` | Página de erro do Pages |
| `CNAME` | Domínio personalizado: `www.geosiim.com` |
| `.nojekyll` | Desliga o Jekyll; os arquivos são servidos como estão |
| `robots.txt`, `sitemap.xml` | Indexação em buscadores |
| `assets/` | Imagens, fontes, favicon |
| `.github/workflows/pages.yml` | Publica a cada push na `main` |

Não há etapa de build: o que está no repositório é o que vai ao ar.

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
registros DNS**, apague os registros `A`/`CNAME` padrão de `@` e `www`
(os de "parking") e crie:

| Tipo | Nome | Aponta para | TTL |
|---|---|---|---|
| `CNAME` | `www` | `geosiim.github.io` | 3600 |
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

**Não** crie registro para `app` ainda — ele será apontado para o servidor
da aplicação (ver abaixo).

Conferir a propagação:

```bash
dig www.geosiim.com +short   # deve mostrar geosiim.github.io e os IPs 185.199.x
dig geosiim.com +short       # os quatro 185.199.10x.153
```

## Trocar a página provisória pelo design

1. No Claude Design, exporte o projeto como HTML (ou "Handoff to Claude Code").
2. Substitua `index.html` e coloque imagens/fontes em `assets/`.
3. Mantenha no `<head>` as metatags de título, descrição, `canonical` e
   Open Graph, e confira que o botão de acesso aponta para
   `https://app.geosiim.com`.
4. Push na `main` → o workflow publica em ~1 minuto.

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

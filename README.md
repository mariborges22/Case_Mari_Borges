# Campaign Link Management API 🚀🚀🚀

Sistema de gerenciamento de links dinâmicos para campanhas de marketing, focado em consistência, segurança e escalabilidade.

## 🧠 Parte Conceitual

### 1. Como você modelou as entidades?
Utilizei uma abordagem de **Clean Architecture**, separando as entidades de domínio da infraestrutura:
- **User**: Dono dos projetos, com isolamento total de dados.
- **Project**: Agrupador de links para organização do usuário.
- **Link**: A entidade central que contém a `baseUrl`, parâmetros dinâmicos e regras de redirecionamento.
- **LinkParameter**: Chave-valor associada ao link para construção dinâmica de query strings (UTMs, etc).
- **RedirectConfig**: Configuração opcional para definir um destino final diferente da base.

### 2. Quais decisões você tomou e por quê?
- **SQLite + Prisma**: Escolhidos pela agilidade e robustez nas transações (ACID), garantindo a consistência exigida.
- **Idempotência**: Implementada via header `X-Idempotency-Key` para evitar duplicidade em retribuições de rede (retries).
- **Security Middleware**: Uso de `helmet` para headers, `express-rate-limit` para DDoS e sanitização nativa via JSON parsing para prevenir injeções.
- **Circuit Breaker**: Preparado para proteger o sistema caso validações externas de URLs se tornem lentas ou falhem.

### 3. Como sua solução resolve o problema de escala na edição de links?
A solução utiliza **templates e parâmetros dinâmicos**. Em vez de editar manualmente cada URL em uma planilha, o usuário edita o objeto `Link` no sistema. A geração final (`/generate`) é computada em tempo real, permitindo que uma alteração na URL base ou em um parâmetro UTM seja propagada instantaneamente para todos os pontos onde o link é utilizado.

---

## 👨‍💻 Exemplo de Uso: José e David

Imagine que **José** e **David** são gestores de tráfego.

1. **José** cria um projeto chamado "Campanha Black Friday".
2. Ele adiciona um Link Base: `https://loja.com/produto-x`.
3. Ele define parâmetros globais: `utm_source=google` e `utm_medium=cpc`.
4. Quando o sistema gera o link via `/api/v1/links/:id/generate`, ele obtém: `https://loja.com/produto-x?utm_source=google&utm_medium=cpc`.

**David**, que trabalha em outra conta, tenta acessar o link do José. O sistema bloqueia o acesso devido ao middleware de **Autorização Estrita**, garantindo que David veja apenas seus próprios projetos.

Se a conexão do David oscilar e ele enviar o mesmo cadastro duas vezes, o sistema detecta a **Chave de Idempotência** e retorna a resposta da primeira tentativa, sem criar duplicatas no banco de dados.

---

## 🚀 Como rodar (CI/CD)

O projeto está configurado para rodar via **GitHub Actions**.
Cada `push` para a branch `master` ou `staging` irá:
1. Instalar dependências.
2. Gerar o client do Prisma.
3. Validar o build do TypeScript.
4. Gerar uma imagem Docker pronta para produção.

---

## 🛠️ Tech Stack
- Node.js + TypeScript
- Express
- Prisma (SQLite)
- JWT (Auth)
- GitHub Actions (CI/CD)
- Docker

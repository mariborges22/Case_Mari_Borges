# Campaign Link Management API 🚀

API de alto desempenho e alta disponibilidade para gerenciamento de links dinâmicos em campanhas de marketing. Este projeto foi submetido a rigorosos testes de **Chaos Engineering** e **Pentesting** para garantir resiliência em escala.

## 🏗️ Decisões de Arquitetura

### 1. Clean Architecture & Hexagonal
O sistema foi construído separando as regras de negócio (Domain/Application) dos detalhes técnicos (Infrastructure).
- **Por que?** Permite trocar o SQLite por Postgres ou o Redis por Memcached sem tocar na lógica de geração de links.

### 2. Resiliência de Infraestrutura (Fail-safe)
O sistema opera em modo **Degradação Graciosa**. Se o Redis (Upstash) cair, o sistema automaticamente busca os dados no banco primário. 
- **Decisão**: Preferimos latência ligeiramente maior do que erro 500 para o usuário.

### 3. Mensageria Assíncrona com RabbitMQ
A geração de links dispara eventos para um barramento.
- **Trade-off**: Usamos **Eventual Consistency**. A API responde rápido ao usuário e o processamento pesado de analytics/logs acontece em background pelo Worker.

---

## ⚖️ Trade-offs Técnicos

| Escolha | Prós | Contras |
| :--- | :--- | :--- |
| **Cloud Redis (Upstash)** | Baixo custo operacional, TLS nativo. | Latência de rede (~170ms) vs Redis local (<1ms). |
| **SQLite + Prisma** | Simplicidade, sem dependência de infra pesada. | Concorrência limitada de escrita (resolvida via Retry Logic). |
| **JWT Stateless** | Escalabilidade horizontal infinita. | Dificuldade para revogar tokens específicos sem blacklist (Redis). |

---

## 🛡️ Relatório de Pentest & Segurança

### 1. IDOR (Insecure Direct Object Reference)
- **Vulnerabilidade**: Links podiam ser acessados por qualquer usuário logado via ID.
- **Correção**: Implementada validação de posse cruzada (`link.project.userId === requesterId`) no Use Case.

### 2. Brute Force (Login)
- **Vulnerabilidade**: Tentativas de login ilimitadas.
- **Correção**: Rate Limiting em camadas. Endpoint de auth bloqueia após 5 falhas em 15min.

### 3. Docker Hardening
- **Correção**: Imagem configurada para rodar como usuário não-root (`node`). Bloqueio de arquivos sensíveis via `.dockerignore`.

---

## 🌋 Post-Mortem: Incidente de Exaustão de Recursos
**Cenário**: Simulação de Memory Leak injetando 50MB a cada 2s.
- **Observação**: A latência saltou de **6ms para 116ms** ao atingir 550MB de RSS.
- **Causa Raiz**: Pressão no Garbage Collector (GC) do Node.js.
- **Solução**: Implementados limites de memória (RSS Monitoring) e indicação de uso de Resource Limits no Kubernetes.

---

## 📊 Observabilidade (SRE)
O sistema exporta métricas via Prometheus em `/api/v1/metrics`:
- `db_query_duration_seconds`: Identifica queries lentas (>100ms).
- `redis_cache_requests_total`: Monitora eficácia do cache (Hit Rate).
- `http_request_duration_seconds`: Latência percebida pelo usuário.

---

## 🚀 Como Rodar
1. Configure o `.env` com `REDIS_URL` e `RABBITMQ_URL`.
2. `npm install`
3. `npx prisma migrate dev`
4. `npm run dev`
5. Para o worker: `npx ts-node src/infrastructure/messaging/rabbitmq-worker.ts`

---

## 🌍 Infraestrutura como Código (IaC)

O projeto inclui um setup completo de DevOps para deploy automatizado:
- **Terraform**: Localizado em `/infrastructure/terraform`, provê a infraestrutura necessária (VPC, Security Groups, Instâncias) de forma modular.
- **Ansible**: Localizado em `/infrastructure/ansible`, automatiza a configuração do SO, instalação do Docker e o deploy da aplicação com um único comando.

### Fluxo de CD (Continuous Deployment) Recomendado:
1.  `terraform apply`: Cria os recursos na nuvem.
2.  `ansible-playbook -i inventory deploy.yml`: Configura e sobe os containers.
3.  **Result**: Ambiente de produção idêntico ao de desenvolvimento em minutos.

---
**Desenvolvido para resiliência máxima e automação total.** 🔥✅

#!/bin/bash
# simulate-traffic.sh

API_URL="http://localhost:3000/api/v1"
echo "--- Iniciando Simulação de Tráfego ---"

# 1. Registrar Usuário
echo "1. Registrando usuário..."
curl -s -X POST "$API_URL/users/register" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jose", "email": "jose@teste.com", "password": "password123"}' | jq .

# 2. Login
echo -e "\n2. Fazendo login..."
LOGIN_RES=$(curl -s -X POST "$API_URL/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "jose@teste.com", "password": "password123"}')
TOKEN=$(echo $LOGIN_RES | jq -r .token)
echo "Token obtido: ${TOKEN:0:20}..."

# 3. Criar Projeto
echo -e "\n3. Criando projeto..."
PROJECT_RES=$(curl -s -X POST "$API_URL/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Campanha Verão 2026"}')
PROJECT_ID=$(echo $PROJECT_RES | jq -r .id)
echo "Projeto criado: $PROJECT_ID"

# 4. Criar Link Management
echo -e "\n4. Criando link dinâmico..."
LINK_RES=$(curl -s -X POST "$API_URL/links" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Promo Facebook\",
    \"baseUrl\": \"https://loja.com/produto\",
    \"projectId\": \"$PROJECT_ID\",
    \"parameters\": [{\"key\": \"utm_source\", \"value\": \"facebook\"}]
  }")
LINK_ID=$(echo $LINK_RES | jq -r .id)
echo "Link criado: $LINK_ID"

# 5. Gerar Link (Simulando Tráfego e Cache)
echo -e "\n5. Gerando link (3 vezes)..."
for i in {1..3}
do
   echo "Tentativa $i..."
   time curl -s -X GET "$API_URL/links/$LINK_ID/generate" \
     -H "Authorization: Bearer $TOKEN" | jq .
   sleep 1
done

# 6. Verificar Métricas
echo -e "\n6. Verificando métricas de Observabilidade..."
curl -s -X GET "$API_URL/metrics" | grep -E "http_request_duration_seconds_count|db_query_duration_seconds_count|redis_cache_requests_total"

echo -e "\n--- Simulação Concluída ---"

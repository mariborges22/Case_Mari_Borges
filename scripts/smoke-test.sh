#!/bin/sh
# smoke-test.sh
# Valida se o serviço está respondendo no container

echo "Iniciando Smoke Test..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)

if [ "$STATUS" -eq 200 ]; then
  echo "SUCCESS: API está respondendo corretamente! (200 OK)"
  exit 0
else
  echo "FAILURE: API retornou status $STATUS ou não está respondendo."
  exit 1
fi

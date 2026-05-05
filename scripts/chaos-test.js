import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 10, // 10 usuários simultâneos
  duration: '30s',
};

// Lê variáveis passadas pelo runner ou ambiente
const LINK_ID = __ENV.LINK_ID || 'link-id-default'; 
const TOKEN = __ENV.TOKEN || 'token-default';

export default function () {
  const params = {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
    },
  };
  
  const res = http.get(`http://localhost:3000/api/v1/links/${LINK_ID}/generate`, params);
  
  const isOk = check(res, {
    'status is 200': (r) => r.status === 200,
  });

  if (!isOk) {
    console.error(`Request Failed! Status: ${res.status} | Body: ${res.body} | Token: ${TOKEN.substring(0, 10)}...`);
  }
  
  sleep(1);
}

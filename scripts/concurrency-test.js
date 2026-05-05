import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 50, // 50 usuários simultâneos
  duration: '20s',
};

const LINK_ID = __ENV.LINK_ID || 'link-id'; 
const TOKEN = __ENV.TOKEN || 'token';

export default function () {
  const params = {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
    },
  };
  
  const res = http.get(`http://localhost:3000/api/v1/links/${LINK_ID}/generate`, params);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  sleep(0.5); // Meio segundo entre requisições
}

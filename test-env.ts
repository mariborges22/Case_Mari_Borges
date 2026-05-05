import dotenv from 'dotenv';
dotenv.config();

console.log('--- DEBUG ENV ---');
console.log('PORT:', process.env.PORT);
console.log('REDIS_URL exists?', !!process.env.REDIS_URL);
if (process.env.REDIS_URL) {
    console.log('REDIS_URL host:', process.env.REDIS_URL.split('@')[1] || 'localhost');
}
console.log('RABBITMQ_URL exists?', !!process.env.RABBITMQ_URL);
console.log('-----------------');

// kafka.js
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'auth-service',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

async function connectKafka() {
  await producer.connect();
}

module.exports = { producer, connectKafka };

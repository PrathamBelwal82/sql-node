require('dotenv').config();
const { Kafka } = require('kafkajs');
const { Client } = require('@elastic/elasticsearch');

// 🔌 Connect to Kafka
const kafka = new Kafka({
  clientId: 'login-log-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'login-log-group' });

// 🔌 Connect to Elasticsearch
const esClient = new Client({
  node: process.env.ELASTIC_NODE || 'http://localhost:9200',
});

// 🏁 Start the consumer
const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'login-events', fromBeginning: false });

  console.log('Kafka consumer connected. Waiting for messages...');

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const logData = JSON.parse(message.value.toString());

        const logEntry = {
          email:logData.email,
          event: logData.event,
          userId: logData.userId,
          ip: logData.ip,
          success: logData.success,
          timestamp: logData.timestamp,
        };

        // Index to Elasticsearch
        await esClient.index({
          index: 'login-events',
          body: logEntry,
        });

        
      } catch (err) {
        console.error(' Error processing message:', err.message);
      }
    },
  });
};

run().catch(console.error);

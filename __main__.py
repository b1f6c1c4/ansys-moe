import os
import etcd3
import pika

def get_etcd():
    host = os.environ.get('ETCD_HOST', 'localhost')
    port = int(os.environ.get('ETCD_PORT', '2379'))
    return etcd3.client(host=host, port=port)

def get_amqp():
    host = os.environ.get('RABBIT_HOST', 'localhost')
    port = int(os.environ.get('RABBIT_PORT', '5672'))
    user = os.environ.get('RABBIT_USER', 'guest')
    pwd = os.environ.get('RABBIT_PASS', 'guest')
    cred = pika.PlainCredentials(user, pwd)
    par = pika.connection.ConnectionParameters(host=host, port=port, credentials=cred)
    return pika.BlockingConnection(par)

etcd = get_etcd()
etcd.put('/hello', 'world')
print(etcd.get('/hello'))
etcd.delete('/hello')

amqp = get_amqp()
ch = amqp.channel()
ch.basic_publish(
    exchange='',
    routing_key='action',
    body='{"hello":"world"}',
    properties=pika.BasicProperties(
        content_type='application/json',
        delivery_mode=2,
    ),
)
amqp.close()

import os
import etcd3
import pika
import logging
from petri import PetriNet

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
# etcd.put('/hello', 'world')
# print(etcd.get('/hello'))
# etcd.delete('/hello')
#
# amqp = get_amqp()
# ch = amqp.channel()
# ch.basic_publish(
#     exchange='',
#     routing_key='action',
#     body='{"hello":"world"}',
#     properties=pika.BasicProperties(
#         content_type='application/json',
#         delivery_mode=2,
#     ),
# )
# amqp.close()

logging.basicConfig(level=logging.DEBUG)

# Create petri net
petri = PetriNet(
    etcd,
    root_regex=r'(?P<root>/[a-z0-9]+)/state',
)

@petri.static(tag='INIT')
def init(_, e, payload):
    print(payload)
    e.incr('/init', 1)

@petri.static(listen=['/init'])
def on_init(_, e):
    e.decr('/init', 1)
    e.incr('/inited', 1)

@petri.static(listen=['/inited'])
def on_inited(_, e):
    e.decr('/inited', 1)

petri.dispatch(('/haha/state', 'INIT', 123))

import os
import etcd3

host = os.environ.get('ETCD_HOST', 'localhost')
port = int(os.environ.get('ETCD_PORT', '2379'))
etcd = etcd3.client(host=host, port=port)

etcd.put('/hello', 'world')
print(etcd.get('/hello'))
etcd.delete('/hello')

# ansys-moe 自动化设计系统

Computer-automated Design (CautoD) System

## Introduction

Using Bayesian Global Optimization (BGO) with [LHSMDU](https://github.com/sahilm89/lhsmdu) and [EPI](https://github.com/sc932/Thesis),
this system automates the solution of optimal design problems,
specifically those involving Ansys, Python, R, and Mathematica.
See `thesis` (in Chinese) folder for more detail.

## Project structure

| Folder | Tech Stack | Deployment | License |
| --- | --- | --- | --- |
| `thesis` 论文 | LaTeX | n/a | Proprietary / GNU AGPLv3 |
| `commond` 计算服务 | Golang | docker/binary | GNU AGPLv3 |
| `controller` 工作流内核 | JavaScript | docker | GNU AGPLv3 |
| `facade` 网站后端 | JavaScript | docker | GNU AGPLv3 |
| `frontend` 网站前端 | React+Redux | docker | MIT |
| `nginx` 反向代理 | nginx | docker | GNU AGPLv3 |
| `storage` 文件存储 | JavaScript | docker | GNU AGPLv3 |
| `elastalert` 告警 | ELK | docker | GNU AGPLv3 |
| `filebeat` 日志上传 | ELK | docker | GNU AGPLv3 |
| `logstash` 日志处理 | ELK | docker | GNU AGPLv3 |

## Build

`thesis`:
```bash
git submodule init
make
```

`commond`, `controller`, `facade`, `storage`:
```bash
vim .env # Set build machine and dockerhub credential
make vendor
make
```

`frontend`:
```bash
eval $(docker-machine env <SRC_BUILD_MACHINE>)
yarn build
```

`nginx`, `elastalert`, `filebeat`, `logstash`:
```bash
docker-compose build
```

Notice: build frontend before build nginx

## Run

```bash
docker-compose up
```

Notice: data stored in `/mnt/ansys-moe`

Notice: one should run artifect `commond-std` or `commond-svc`
from `commond` to enable Ansys and Mathematica support.

## Legal Stuff

`commond`, `controller`, `elastalert`, `facade`, `filebeat`, `frontend`, `logstash`, `nginx`, and `storage` components are licensed under GNU AGPLv3 License,
`frontend` component is licensed under MIT License,
while `thesis` is *Proprietary work with all right reserved* (except `thesis/data`, which is licensed under GNU AGPLv3 License).

Besides, the author has distributed this project to Tsinghua University as well, under different licenses, and authorized Tsinghua University to store and publish `thesis`.


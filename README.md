# ansys-moe 自动化设计系统

Computer-automated Design (CautoD) System

## Introduction

Using Bayesian Global Optimization (BGO) with [LHSMDU](https://github.com/sahilm89/lhsmdu) and [EPI](https://github.com/sc932/Thesis),
this system automates the solution of optimal design problems,
specifically those involving Ansys, Python, R, and Mathematica.
See `thesis` (in Chinese) folder for more detail.

## Project structure

| Folder | Tech Stack | Deployment |
| --- | --- | --- |
| `thesis` 论文 | LaTeX | n/a |
| `commond` 计算服务 | Golang | docker/binary |
| `controller` 工作流内核 | JavaScript | docker |
| `facade` 网站后端 | JavaScript | docker |
| `frontend` 网站前端 | React+Redux | docker |
| `nginx` 反向代理 | nginx | docker |
| `storage` 文件存储 | JavaScript | docker |
| `elastalert` 告警 | ELK | docker |
| `filebeat` 日志上传 | ELK | docker |
| `logstash` 日志处理 | ELK | docker |

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


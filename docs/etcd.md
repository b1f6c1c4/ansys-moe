# etcd in ansys-moe

# /:proj

## /config

See config.md

## /state

Models the Petri net.

### /init

### /cat/:cHash

#### /init

#### /:phase=scan|iterate/:dHash

- /init
- /G/:name
  - /init
  - /prep
- /M/mutate
- /M/solve
- /E/:name
  - /init
  - /prep
- /P/:name
  - /init
  - /prep

#### /estimate

#### /optimize

### /done

## /hashs

- /cHash/:cHash
- /dHash/:dHash
- /mHash/:mHash

## /results

#### /d/:dHash

- /G/:name
- /M/:name
- /E/:name
- /P/:name
- /P0

#### /cat/:cHash

- /estimate

### /final


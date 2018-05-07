# etcd in ansys-moe

# /:proj

## /config

See config.md

## /concurrent

## /state

Models the Petri net.

### /init

### /cat/:cHash

#### /init

#### /eval/:dHash

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

#### /iter

- /hint
- /req
- /calc

### /done

## /hashs

- /cHash/:cHash
- /dHash/:dHash
- /mHash/:mHash

## /results

#### /d/:dHash

- /var
- /Mid
- /G/:name
- /M/:name
- /E/:name
- /P/:name
- /P0

#### /cat/:cHash

- /D
- /history
- /ongoing
- /iterate

### /final


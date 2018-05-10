# etcd in ansys-moe

# /hashs

- /mHash/:mHash
  - file - sha1 of ansys file content
  - vars - dict of used variables
- /cHash/:cHash
  - dict of active categorical variables
- /dHash/:dHash
  - dict of active design variables

# /p/:proj

## /config

## /state

- /error
- /init
- /cat/:cHash
  - /error
  - /init
  - /eval/:dHash
    - /error
    - /init
    - /G/:name
      - /error
      - /init
      - /prep
    - /M/solve
    - /E/:name
      - /error
      - /init
      - /prep
    - /P/:name
      - /error
      - /init
      - /prep
  - /iter
    - /hint
    - /req
    - /calc
- /done

## /results

- /d/:dHash
  - /var
  - /Mid
  - /G/:name
  - /E/:name
  - /P/:name
  - /P0
- /cat/:cHash
  - /D
  - /history
  - /ongoing
  - /iterate
- /final


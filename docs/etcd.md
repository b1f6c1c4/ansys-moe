# etcd in ansys-moe

# /hashs

- /mHash/:mHash
  - file - sha1 of ansys file content
  - vars - dict of used variables
  - output - dict of:
    - design
    - table
    - column
- /cHash/:cHash
  - dict of active categorical variables
- /dHash/:dHash
  - dict of active design variables

# /results

- /M/:mHash
   - dict of M variables

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
    - /M/done
    - /E/:name
      - /error
      - /init
      - /prep
    - /P/:name
      - /error
      - /init
      - /prep
    - /P0
  - /iter
    - /hint
    - /req
    - /calc
  - /conv
- /done

## /results

- /d/:dHash
  - /ei
  - /startTime
  - /endTime
  - /var
  - /Mid
  - /mHash
  - /G/:name
  - /E/:name
  - /P/:name
  - /P0
- /cat/:cHash
  - /D
  - /history
  - /ongoing
  - /iterate
- /finals
- /final


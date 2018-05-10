# rabbit in ansys-moe

# Queues

- ansys (AnsysCommand) - every single ansys execution
- rlang (RLangCommand) - rlang as a calculator
- mathematica (MmaCommand) - mathematica as a calculator
- action - trigger state change

# Exchanges

- cancel - kill execution
  - `cancel.<kind>.<cId>` (null)

# Properties

- correlation\_id - cId
- content\_type - application/json
- headers
  - cfg - config hash
  - kind - required for action
    - core (CoreAction)
    - ansys (AnsysAction)
    - rlang (RLangAction)
    - mathematica (MmaAction)

# Data Structures

## CoreAction (object)

- type (enum, required)
  - `run` - run a new project or modify an existing project
- name (string, required)
- config (object, required)

## AnsysCommand (object)

- file (string, required)
- script (string)

Make directory `data/{cId}/output`
Download `storage/{file}` to `data/{cId}/{file.name}`
Replace `$OUT_DIR` in `script` to `data/{cId}/output`
Save `script` to `data/{cId}/script.vbs`
Run `batchsave` over `data/{cId}/{file.name}`
Log to `data/{cId}/solve.log`
Report log difference
Upload `data/{cId}/` to `storage/{cId}/`
Drop directory `data/{cId}/`

## AnsysAction (object)

- type (enum, required)
  - `failure`
  - `cancel`
  - `done`

## RLangCommand (object)

- script (string, required)

## RLangAction (object)

- type (enum, required)
  - `failure`
  - `cancel`
  - `done`

- result (string)

## MmaCommand (object)

- script (string, required)

## MmaAction (object)

- type (enum, required)
  - `failure`
  - `cancel`
  - `done`

- result (string)

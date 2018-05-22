# rabbit in ansys-moe

# Queues

- action - trigger state change
- ansys (AnsysCommand) - every single ansys execution
- python (PythonCommand) - python as a calculator
- rlang (RLangCommand) - rlang as a calculator
- mathematica (MmaCommand) - mathematica as a calculator

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
    - expression (ExpAction)
    - ansys (AnsysAction)
    - python (PythonAction)
    - rlang (RLangAction)
    - mathematica (MmaAction)

# Data Structures

## CoreAction (object)

- type (enum, required)
  - `run` - run a new project or modify an existing project
- name (string, required)
- config (object, required)

## ExpAction (object)

- type (enum, required)
  - `failure`
  - `done`
- result (number)

## AnsysCommand (object)

- source (string, required)
- destination (string, required)
- script (string)

Make directory `data/{cId}/output`
Download `storage/{source}` to `data/{cId}/{destination}`
Replace `$OUT_DIR` in `script` to `data/{cId}/output`
Save `script` to `data/{cId}/script.vbs`
Run `batchsave` over `data/{cId}/{destination}`
Log to `data/{cId}/solve.log`
Report log difference
Upload `data/{cId}/` to `storage/{cId}/`
Drop directory `data/{cId}/`

## AnsysAction (object)

- type (enum, required)
  - `failure`
  - `cancel`
  - `done`

## PythonCommand (object)

- script (string, required)

## PythonAction (object)

- type (enum, required)
  - `failure`
  - `cancel`
  - `done`

- result (string)

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

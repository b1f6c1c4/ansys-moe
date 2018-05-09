# rabbit in ansys-moe

# Queues

* Majors:
  * ansys (AnsysCommand) - every single ansys execution.
* Calculators:
  * rlang (RLangCommand) - rlang as a calculator.
  * mathematica (MmaCommand) - mathematica as a calculator.
  * matlab - matlab as a calculator.
* Callback:
  * action - trigger state change after execution.
    - kind:rlang (RLangAction)
    - kind:ansys (AnsysAction)
    - kind:mathematica (MmaAction)
* Exchange:
  * cancel - kill execution.
    * `cancel.<kind>.<cId>` (null)

# Data Structures

## AnsysCommand (object)

- type (enum, required)
  - `mutate`

    Download `storage/{file}` to `data/{cId}/{file.name}`
    Save `script` to `data/{cId}/script.vbs`
    Run `batchsave` over `data/{cId}/{file.name}`
    Log to `data/{cId}/mutate.log`
    Report log difference
    Upload `data/{cId}/` to `storage/{cId}/`
    Drop directory `data/{cId}/`

  - `solve`

    Make directory `data/{cId}/output`
    Download `storage/{file}` to `data/{cId}/{file.name}`
    Replace `$OUT_DIR` in `script` to `data/{cId}/output`
    Save `script` to `data/{cId}/script.vbs`
    Run `batchsave` over `data/{cId}/{file.name}`
    Log to `data/{cId}/solve.log`
    Report log difference
    Upload `data/{cId}/` to `storage/{cId}/`
    Drop directory `data/{cId}/`

- file (string, required)
- script (string)

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

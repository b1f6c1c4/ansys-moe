# rabbit in ansys-moe

# Queues

* Majors:
  * ansys (AnsysCommand) - every single ansys execution.
  * moe (MoeCommand) - every single moe execution.
* Calculators:
  * rlang (RLangCommand) - rlang as a calculator.
  * mathematica (MmaCommand) - mathematica as a calculator.
  * matlab - matlab as a calculator.
* Callback:
  * action - trigger state change after execution.
    - kind:ansys (AnsysAction)
    - kind:moe (MoeAction)
    - kind:rlang (RLangAction)
    - kind:mathematica (MmaAction)
* Exchange:
  * monitor - system status, don't persist.
    * `status.<kind>[.<cId>]` (StatusReport)
    * `log.<kind>[.<cId>]` (LogReport)
  * cancel - kill execution.
    * `cancel.<kind>.<cId>` (null)

# Data Structures

## StatusReport (object)

- cpu (object)
- mem (object)

## LogReport (object)

- level (enum, required)
  - `trace`
  - `debug`
  - `info`
  - `warn`
  - `error`
  - `fatal`
- source (string, required)
- data (any)

## AnsysCommand (object)

- type (enum, required)
  - `mutate`

    Download `storage/{file}` to `data/{cId}/{file.name}`
    Save `script` to `data/{cId}/script.vbs`
    Run `batchsave` over `data/{cId}/{file.name}`
    Log to `data/{cId}/mutate.log`
    Upload `data/{cId}/` to `storage/{cId}/`
    Drop directory `data/{cId}/`

  - `solve`

    Make directory `data/{cId}/output`
    Download `storage/{file}` to `data/{cId}/{file.name}`
    Replace `$OUT_DIR` in `script` to `data/{cId}/output`
    Save `script` to `data/{cId}/script.vbs`
    Run `batchsave` over `data/{cId}/{file.name}`
    Log to `data/{cId}/solve.log`
    Report system status and log difference
    Upload `data/{cId}/` to `storage/{cId}/`
    Drop directory `data/{cId}/`

- file (string, required)
- script (string)

## AnsysAction (object)

- type (enum, required)
  - `failure`

    If anything obviously wrong happens

  - `done`

    If the procedure finished successfully

## MoeCommand (object)

- type (enum, required)
  - `EI`
- D (array[object], required)
  - kind (enum, required)
    - `discrete`
    - `continuous`
  - lowerBound (number, required)
  - upperBound (number, required)
  - precision (number, required)
- q (number, required)
- current (array[object], required)
  - D (array[number], required)
- done (array[object], required)
  - D (array[number], required)
  - P0 (number, required)

## MoeAction (object)

- type (enum, required)
  - `failure`

    If anything wrong happens

  - `done`

    If nothing wrong happens

- result (enum)
  - string
  - object
    - next (array[object])
      - D (array[number], required)

## RLangCommand (object)

- script (string, required)

## RLangAction (object)

- type (enum, required)
  - `failure`

    If anything obviously wrong happens

  - `done`

    If the procedure finished successfully

- result (string)

## MmaCommand (object)

- script (string, required)

## MmaAction (object)

- type (enum, required)
  - `failure`

    If anything obviously wrong happens

  - `done`

    If the procedure finished successfully

- result (string)

# rabbit in ansys-moe

# Queues

* Majors:
  * ansys (AnsysCommand) - every single ansys execution.
  * moe - every single moe execution.
* Calculators:
  * mathematica - mathematica as a calculator.
  * matlab - matlab as a calculator.
  * javascript - javascript as a calculator.
* Callback:
  * action - trigger state change after execution.
    - kind:ansys (AnsysAction)
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
    Run `batchsolve` over `data/{cId}/{file.name}`
    Log to `data/{cId}/solve.log`
    Report system status and log difference
    Save `script` to `data/{cId}/script.vbs`
    Replace `$OUT_DIR` in `script` to `data/{cId}/output`
    Run `batchextract` over `data/{cId}/{file.name}`
    Log to `data/{cId}/extract.log`
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


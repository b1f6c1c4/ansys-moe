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
    - (AnsysAction)
* Exchange:
  * monitor - system status, don't persist.
    * `status:<type>[:<cId>]` (StatusReport)
    * `log:<type>[:<cId>]` (LogReport)
  * cancel - kill execution.
    * `cancel:<type>:<cId>` (null)

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
    Log to `data/{cId}/ansys.log`
    Upload `data/{cId}/` to `storage/{cId}/`
    Report finished, ack the command
    Drop directory `data/{cId}/`

  - `solve`

    Download `storage/{file}` to `data/{cId}/{file.name}`
    Run `batchsolve` over `data/{cId}/{file.name}`
    Log to `data/{cId}/ansys.log`
    Report system status and log difference
    Upload `data/{cId}/` to `storage/{cId}/`
    Report finished, ack the command
    Drop directory `data/{cId}/`

  - `extract`

    Make directory `data/{cId}/output`
    Download `storage/{file}` to `data/{cId}/{file.name}`
    Save `script` to `data/{cId}/script.vbs`
    Replace `$OUT_DIR` in `script` to `data/{cId}/output`
    Run `batchextract` over `data/{cId}/{file.name}`
    Log to `data/{cId}/ansys.log`
    Upload `data/{cId}/` to `storage/{cId}/`
    Report finished, ack the command
    Drop directory `data/{cId}/`

- file (string, required)
- script (string)

## AnsysAction (object)

- type (enum, required)
  - `failure`
  - `success`
- phase (string)
- message (string)

# config json in ansys-moe

All name strings MUST match `/^[a-z][_a-z0-9]*$/`
All other strings MUST match `/^[a-z][-_a-z0-9]*$/`

# Data Structures

## Config (object)

- initEvals (number, required)
- minEvals (number, required)
- concurrent (number, required)
- minEI (number)
- D (array[DParameter], required)
- G (array[GParameter], required)
- E (array[EParameter], required)
- P (array[PParameter], required)
- P0 (P0Parameter, required)
- ansys (AnsysConfig, required)

## DParameter (object)

- name (string, required)
- kind (enum, required)
  - `categorical`
  - `discrete`
  - `continuous`

If kind `categorical`: `[1, steps]`
- steps (number, required) - at least 2
- dependsOn (array[string]) - other kind `categorical`
- condition (string) - kind expression

If kind `discrete`:
- lowerBound (number, required)
- upperBound (number, required)
- steps (number, required) - at least 2
- dependsOn (array[string]) - other kind `categorical`
- condition (string) - kind expression

If kind `continuous`:
- lowerBound (number, required)
- upperBound (number, required)
- precision (number, required)
- dependsOn (array[string]) - other kind `categorical`
- condition (string) - kind expression

## GParameter (object)

- name (string, required)
- kind (enum, required)
  - `expression`
  - `rlang`
  - `mathematica`
  - `matlab`
- code (string, required)
- dependsOn (array[string])
- lowerBound (number)
- upperBound (number)

## EParameter (object)

- name (string, required)
- kind (enum, required)
  - `expression`
  - `rlang`
  - `mathematica`
  - `matlab`
- code (string, required)
- dependsOn (array[string])
- lowerBound (number)
- upperBound (number)

## PParameter (object)

- name (string, required)
- kind (enum, required)
  - `expression`
  - `rlang`
  - `mathematica`
  - `matlab`
- code (string, required)
- dependsOn (array[string])
- lowerBound (number)
- upperBound (number)

## P0Parameter (object)

- default (number) - default 0
- code (string, required) - kind expression

## AnsysConfig (object)

- rules (array[AnsysRule], required)

## AnsysRule (object)

- source (string, required)
- destination (string, required)
- condition (string) - kind expression
- inputs (array[AnsysInput], required)
- outputs (array[AnsysOutput], required)
- onError (enum)
  - `halt` (default)
  - `ignore`
  - `default`

## AnsysInput (object)

- name (string, required)
- design (string)
- variable (string, required)

## AnsysOutput (object)

- name (string, required)
- design (string, required) - any string is acceptable
- table (string, required) - any string is acceptable
- column (number, required)
- lowerBound (number)
- upperBound (number)


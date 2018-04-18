# config json in ansys-moe

# Data Structures

## Config (object)

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
- lowerBound (number) - 1 if categorical
- upperBound (number) - steps if categorical
- steps (number, required) - at least 2
- condition (string) - kind expression

## GParameter (object)

- name (string, required)
- kind (enum, required)
  - `expression`
  - `rlang`
  - `mathematica`
  - `matlab`
- code (string, required)
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
- lowerBound (number)
- upperBound (number)

## P0Parameter (object)

- name (string, required)
- code (string, required) - kind expression

## AnsysConfig (object)

- rules (array[AnsysRule], required)

## AnsysRule (object)

- filename (string, required)
- condition (string) - kind expression
- inputs (array[AnsysInput], required)
- outputs (array[AnsysOutput], required)

## AnsysInput (object)

- name (string, required)
- design (stirng)
- variable (string, required)

## AnsysOutput (object)

- name (string, required)
- design (string, required)
- table (string, required)
- column (number, required)


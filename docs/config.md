# config json in ansys-moe

All strings MUST match `/^[-_a-z0-9]+$/`, unless specified.

# Data Structures

## Config (object)

- D (array[DParameter], required)
- G (array[GParameter], required)
- E (array[EParameter], required)
- P (array[PParameter], required)
- P0 (P0Parameter, required)
- ansys (AnsysConfig, required)
- moe (MoeConfig)

## DParameter (object)

- name (string, required)
- kind (enum, required)

If kind === `categorical`:

- levels (number, required) - 1 .. levels
- descriptions (array[string])
- dependsOn (array[string]) - name of other categorical D pars
- condition (string) - kind expression

If kind === `discrete`:

- lowerBound (number) - integer, default 0
- upperBound (number, required) - integer
- condition (string) - kind expression

If kind === `continuous`:

- lowerBound (number) - default 0
- upperBound (number, required)
- precision (number) - default (upperBound - lowerBound) / 100
- condition (string) - kind expression

## GParameter (object)

- name (string, required)
- kind (enum, required)
  - `expression`
  - `rlang`
  - `mathematica`
  - `matlab`
- code (string, required)
- dependsOn (array[string]) - name of other G pars
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
- dependsOn (array[string]) - name of other E pars
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
- dependsOn (array[string]) - name of other P pars
- lowerBound (number)
- upperBound (number)

## P0Parameter (object)

- name (string, required)
- code (string, required) - kind expression

## AnsysConfig (object)

- rules (array[AnsysRule], required)

## AnsysRule (object)

- filename (string, required) - any string is acceptable
- condition (string) - kind expression
- inputs (array[AnsysInput], required)
- outputs (array[AnsysOutput], required)

## AnsysInput (object)

- name (string, required)
- design (string)
- variable (string, required)

## AnsysOutput (object)

- name (string, required)
- design (string, required) - any string is acceptable
- table (string, required) - any string is acceptable
- column (number, required)

## MoeConfig (object)

- likelihoodEvaluator (enum)
  - `LogMarginalLikelihoodEvaluator`
  - `LeaveOneOutLogLikelihoodEvaluator` - default
- covarianceClass (enum)
  - `SquareExponential` - default
  - `MaternNu1p5`
  - `MaternNu2p5`
- initAlpha (number) - default 1
- initL (object)
  - \[name\] (number) - default (upperBound - lowerBound) / 3
- hyperparameterNewton (object)
  - maxNumSteps (number) - default 500
  - gamma (number) - default 1.05
  - preMult (number) - default 0.1
  - maxRelativeChange (number) - 1.0
  - tolerance (number) - 1.0e-11
- eiNewton (object)
  - maxNumSteps (number) - default 500
  - gamma (number) - default 1.05
  - preMult (number) - default 0.1
  - maxRelativeChange (number) - 1.0
  - tolerance (number) - 1.0e-11

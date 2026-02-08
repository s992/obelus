# Obelus

this is the frontend component of Obelus, a private, multi-user reading record app focused on judgment and notes.

## stack

- typescript
- react
- vite
- untitled ui component library
- css should be written using vanilla-extract; *do not use tailwind*
- use of redux is *not permitted*
- use of tanstack (especially query) is encouraged
- react-hook-form for forms
- zod for form validation
- biome for formatting
- oxlint for linting

## best practices

- one component per component file
- from a component file, do not export anything other than the component and (optionally, if needed) its `Props` type
- components should be co-located with their css in a component-specific directory. the location of the directory should be hierarchically relevant (i.e. don't bury a shared component in a feature directory or stick a feature-specific component in a shared directory)
- prefer breaking complex logic into hooks or utility functions
- hooks and utility functions should live in files separate from the component(s) in which they are used
- prefer routed components over ui-state-driven routing

## accessibility/a11y

ensure new code is written with a strong focus on accessibility.

## testing strategy

do not write e2e tests. unit + integration testing is sufficient.

## tailwind

tailwind is only permitted in generated code from the untitled ui component library. *do not* write any new tailwind code

## brand/design

all changes should be evaluated against brand guidelines defined in `{repo root}/docs/BRAND.md`

## mcps

utilize the following mcps as needed:

- chrome-devtools: for any manual/functional testing of the application
- utitledui: for any questions about our component library

## validation

use the chrome-devtools mcp to perform functional testing on any changes you make. look for both behavioral and visual regressions when testing.
import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['overrideHide']
type SetContext = (v: persisted.Schema['overrideHide']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.overrideHide,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['overrideHide']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('overrideHide'))

  const setStateWrapped = React.useCallback(
    (overrideHide: persisted.Schema['overrideHide']) => {
      setState(overrideHide)
      persisted.write('overrideHide', overrideHide)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('overrideHide', nextOverrideHide => {
      setState(nextOverrideHide)
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useOverrideHide() {
  return React.useContext(stateContext)
}

export function useSetOverrideHide() {
  return React.useContext(setContext)
}

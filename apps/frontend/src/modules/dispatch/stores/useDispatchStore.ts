import { defineStore } from 'pinia'
import { createDispatchState, createStoreActions } from './dispatchStoreActions'

export const useDispatchStore = defineStore('dispatch', () => {
  const state = createDispatchState()
  const actions = createStoreActions(state)

  return {
    ...state,
    ...actions,
  }
})
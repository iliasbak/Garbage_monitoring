import { ConfirmationResult, UserCredential } from 'firebase/auth'
import {atom} from 'jotai'
import {atomWithStorage, createJSONStorage} from 'jotai/utils'
import AsyncStorage from '@react-native-async-storage/async-storage'

const storage = createJSONStorage<UserCredential | null>(() => AsyncStorage)
const content = {}

// atom is a modular state which we can use in multiple screens
export const credentialAtom = atomWithStorage<UserCredential | null>('credential', null, storage)
export const confrimationResultAtom = atom<ConfirmationResult | null>(null)
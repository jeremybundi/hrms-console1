import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

/** The signed-in platform admin, signIn / signOut, and `notice` ('idle' after an idle sign-out). */
export const useAuth = () => useContext(AuthContext)

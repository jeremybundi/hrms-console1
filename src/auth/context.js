import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

/** The signed-in platform admin, and signIn / signOut. */
export const useAuth = () => useContext(AuthContext)

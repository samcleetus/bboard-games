import {createContext, useState, useEffect, useContext, use} from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext()

export const AuthContextProvider = ({children}) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)



    // Sign Up 
    const signUpNewUser = async (email, password, username) => {
        const {data, error} = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username
                }
            }
        })

        if (error) {
            console.error("Error signing up: ", error);
            return { success: false, error };
        }
        return { success: true, data };
    } // Close signUpNewUser

    // Sign In
    const signInUser = async( email, password ) => {
        try {
            const { data, error} = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            })
            if (error) {
                console.error("Error signing in: ", error);
                return { success: false, error: error.message };
            }
            console.log("Sign-in successful: ", data);
            return { success: true, data };
        } catch(error) {
            console.error("Error signing in: ", error);
            return { success: false, error: error.message };
        }
    }


   useEffect(() => { 
       supabase.auth.getSession().then(({ data: { session } }) => {
           setSession(session)
           setLoading(false)
       })

       const {
           data: { subscription },
       } = supabase.auth.onAuthStateChange((_event, session) => {
           setSession(session)
           setLoading(false)
       })

       return () => subscription.unsubscribe()
   }, []);

   if (loading) {
       return <div>Loading...</div>
   }

   // Sign Out
   const signOut = () => {
        const { error } = supabase.auth.signOut()
        if (error) {
            console.error("Error signing out: ", error);
        }
   }


    return (
      <AuthContext.Provider value={{ session, signUpNewUser, signInUser, signOut }}>
        {children}
      </AuthContext.Provider>
    )
}

export const UserAuth = () => {
  return useContext(AuthContext)
}
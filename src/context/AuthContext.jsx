import {createContext, useState, useEffect, useContext} from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext()

export const AuthContextProvider = ({children}) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)

  // Fetch user profile data
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUserProfile(data);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  // Sign Up 
  const signUpNewUser = async (email, password, username, gradeLevel) => {
    try {
      // First, create the auth user
      const {data, error} = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            username: username,
            grade_level: gradeLevel
          }
        }
      })

      if (error) {
        console.error("Error signing up: ", error);
        return { success: false, error };
      }

      // If user creation was successful and we have a user ID, update the profile
      if (data.user && data.user.id) {
        try {
          // Wait a moment for the profile trigger to create the initial row
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update the profile with grade level
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              username: username,
              grade_level: gradeLevel 
            })
            .eq('id', data.user.id);

          if (profileError) {
            console.error("Error updating profile: ", profileError);
            // Don't fail the signup if profile update fails
          }
        } catch (profileError) {
          console.error("Error updating profile: ", profileError);
          // Don't fail the signup if profile update fails
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error signing up: ", error);
      return { success: false, error };
    }
  }

  // Sign In
  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      })
      if (error) {
        console.error("Error signing in: ", error);
        return { success: false, error: error.message };
      }
      console.log("Sign-in successful: ", data);
      return { success: true, data };
    } catch (error) {
      console.error("Error signing in: ", error);
      return { success: false, error: error.message };
    }
  }

  // Sign Out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error signing out: ", error);
    } else {
      setUserProfile(null);
    }
  }

  useEffect(() => { 
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user?.id) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user?.id) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, []);

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <AuthContext.Provider value={{ 
      session, 
      userProfile, 
      signUpNewUser, 
      signInUser, 
      signOut, 
      fetchUserProfile 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const UserAuth = () => {
  return useContext(AuthContext)
}
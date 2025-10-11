import React from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";


// Main Screen 
const Dashboard = () => {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate()

  //console.log(session)

  const handleSignOut = async (e) => {
    e.preventDefault()
    try {
      await signOut();
      navigate('/signin')
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <h1 className="text-center pt-4 text-3xl">Dashboard</h1>

      <div>
        <p className="hover:cursor-pointer border inline-block px-4 py-3 mt-4" onClick={handleSignOut}>Sign Out</p>
      </div>
    </div>
  );
}

export default Dashboard;
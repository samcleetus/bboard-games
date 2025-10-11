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
    <div className="min-h-screen" 
         style={{ backgroundColor: 'var(--umn-maroon)' }}>
      
      {/* Header */}
      <div className="pt-8 pb-6 text-center">
        <h1 className="text-5xl font-bold text-white drop-shadow-lg">
          BBoard Games
        </h1>
      </div>

      {/* Sign Out Button */}
      <div className="absolute top-6 right-6">
        <button 
          onClick={handleSignOut}
          className="px-6 py-3 rounded-lg font-medium transition-all duration-200 border-2"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--umn-gold)',
            borderColor: 'var(--umn-gold)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'var(--umn-gold)';
            e.target.style.color = 'var(--umn-maroon)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = 'var(--umn-gold)';
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Content Area - Ready for your additions */}
      <div className="px-8 py-4">
        {/* Your future content will go here */}
      </div>
    </div>
  );
}

export default Dashboard;
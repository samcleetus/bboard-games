import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Signin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { signInUser } = UserAuth();
    const navigate = useNavigate();

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            const result = await signInUser(email, password);

            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.error?.message || 'Sign in failed');
            }
        } catch (error) {
            setError(error.message);
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" 
             style={{
                 background: `
                     radial-gradient(circle at 80% 30%, rgba(255, 204, 51, 0.12) 0%, transparent 50%),
                     radial-gradient(circle at 30% 70%, rgba(255, 204, 51, 0.08) 0%, transparent 50%),
                     linear-gradient(135deg, 
                         var(--umn-maroon-ink) 0%, 
                         var(--umn-maroon) 25%, 
                         var(--umn-maroon-600) 50%,
                         var(--umn-maroon) 75%,
                         var(--umn-maroon-ink) 100%
                     )`
             }}>
            
            {/* Floating Elements - Different positions from Signup */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 right-20 w-36 h-36 rounded-full opacity-8"
                     style={{ backgroundColor: 'var(--umn-gold)' }}></div>
                <div className="absolute bottom-1/4 left-10 w-28 h-28 rounded-full opacity-6"
                     style={{ backgroundColor: 'var(--umn-gold)' }}></div>
                <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full opacity-10"
                     style={{ backgroundColor: 'var(--umn-gold)' }}></div>
                <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full opacity-4"
                     style={{ backgroundColor: 'var(--umn-gold)' }}></div>
            </div>

            <div className="max-w-md w-full space-y-8 relative z-10">
                {/* Header */}
                <div className="text-center">
                    <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                        Welcome Back
                    </h2>
                    <p style={{ color: 'var(--umn-gold)' }} 
                       className="text-lg font-medium drop-shadow-md">
                        Sign in to continue your gaming journey
                    </p>
                </div>

                {/* Glassy Form */}
                <form className="rounded-2xl p-8 shadow-2xl border backdrop-blur-lg relative overflow-hidden" 
                      style={{
                          background: `
                              linear-gradient(135deg, 
                                  rgba(255, 255, 255, 0.15) 0%, 
                                  rgba(255, 255, 255, 0.05) 100%
                              )`,
                          borderColor: 'rgba(255, 204, 51, 0.3)',
                          borderWidth: '1px',
                          boxShadow: `
                              0 25px 50px -12px rgba(0, 0, 0, 0.25),
                              inset 0 1px 0 rgba(255, 255, 255, 0.1)
                          `
                      }}
                      onSubmit={handleSignIn}>
                    
                    {/* Subtle inner glow - different position from Signup */}
                    <div className="absolute inset-0 rounded-2xl pointer-events-none"
                         style={{
                             background: `radial-gradient(circle at 80% 20%, rgba(255, 204, 51, 0.06) 0%, transparent 60%)`
                         }}></div>
                    
                    <div className="space-y-6 relative z-10">
                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white drop-shadow-sm">
                                Email
                            </label>
                            <input 
                                onChange={(e) => setEmail(e.target.value)} 
                                className="w-full px-4 py-3 rounded-lg transition-all duration-300 focus:outline-none backdrop-blur-sm placeholder-white/60"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                                }}
                                onFocus={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                                    e.target.style.borderColor = 'var(--umn-gold)';
                                    e.target.style.boxShadow = `0 0 0 2px rgba(255, 204, 51, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.1)`;
                                }}
                                onBlur={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.1)';
                                }}
                                type="email" 
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white drop-shadow-sm">
                                Password
                            </label>
                            <input 
                                onChange={(e) => setPassword(e.target.value)} 
                                className="w-full px-4 py-3 rounded-lg transition-all duration-300 focus:outline-none backdrop-blur-sm placeholder-white/60"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                                }}
                                onFocus={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                                    e.target.style.borderColor = 'var(--umn-gold)';
                                    e.target.style.boxShadow = `0 0 0 2px rgba(255, 204, 51, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.1)`;
                                }}
                                onBlur={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.1)';
                                }}
                                type="password" 
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <button 
                            className="w-full py-4 px-4 rounded-lg font-semibold focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] text-white relative overflow-hidden" 
                            style={{
                                background: `linear-gradient(135deg, var(--umn-gold) 0%, var(--umn-gold-dark) 100%)`,
                                color: 'var(--umn-maroon)',
                                boxShadow: `
                                    0 10px 25px rgba(255, 204, 51, 0.2),
                                    inset 0 1px 0 rgba(255, 255, 255, 0.2)
                                `
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = `linear-gradient(135deg, var(--umn-gold-dark) 0%, var(--umn-gold) 100%)`;
                                e.target.style.boxShadow = `
                                    0 15px 35px rgba(255, 204, 51, 0.3),
                                    inset 0 1px 0 rgba(255, 255, 255, 0.2)
                                `;
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = `linear-gradient(135deg, var(--umn-gold) 0%, var(--umn-gold-dark) 100%)`;
                                e.target.style.boxShadow = `
                                    0 10px 25px rgba(255, 204, 51, 0.2),
                                    inset 0 1px 0 rgba(255, 255, 255, 0.2)
                                `;
                            }}
                            type="submit" 
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 mr-2" 
                                         style={{ borderColor: 'var(--umn-maroon)' }}></div>
                                    Signing In...
                                </div>
                            ) : (
                                "Sign In"
                            )}
                        </button>

                        {/* Error Message */}
                        {error && (
                            <div className="px-4 py-3 rounded-lg text-center backdrop-blur-sm"
                                 style={{
                                     background: 'rgba(239, 68, 68, 0.15)',
                                     border: '1px solid rgba(239, 68, 68, 0.3)',
                                     color: '#fca5a5'
                                 }}>
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Sign Up Link */}
                    <div className="mt-6 text-center relative z-10">
                        <p className="text-white/80">
                            Don't have an account? 
                            <Link to='/signup' 
                                  className="font-semibold ml-1 transition-colors duration-200 hover:underline"
                                  style={{ 
                                      color: 'var(--umn-gold)',
                                  }}
                                  onMouseEnter={(e) => e.target.style.color = 'var(--umn-gold-dark)'}
                                  onMouseLeave={(e) => e.target.style.color = 'var(--umn-gold)'}>
                                Sign up here
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Signin;
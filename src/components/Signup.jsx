import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Signup = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState("");
    const [error, setError] = useState("");

    const { session, signUpNewUser } = UserAuth();
    const navigate = useNavigate();

    //console.log(session);

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true)
        try {
            const result = await signUpNewUser(email, password, username);

            if (result.success) {
                navigate('/dashboard');
            }
        } catch (error) {
            setError(error.message);
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
    <div>
        <form className="max-w-md m-auto pt-24" onSubmit={handleSignup}>
        <h2 className="font-bold pb-2">Sign Up Today</h2>
        <p>Already have an account? <Link to='/signin'>Sign in!</Link></p>

        <div className="flex flex-col py-4">
            <input onChange={(e) => setEmail(e.target.value)} className="p-3 mt-2" type="email" placeholder="Email"/>
            <input onChange={(e) => setPassword(e.target.value)} className="p-3 mt-2" type="password" placeholder="Password"/>
            <input onChange={(e) => setUsername(e.target.value)} className="p-3 mt-2" type="text" placeholder="Username"/>
            <button className="bg-blue-500 text-white p-3 mt-4 w-full" type="submit" disabled={loading}>Sign Up</button>
            {error && <p className="text-red-500 text-center pt-4">{error}</p>}
        </div>

        </form>
    </div>
    );
    }

export default Signup;

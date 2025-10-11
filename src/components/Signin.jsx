import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Signin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState("");
    const [error, setError] = useState("");

    const { session, signInUser } = UserAuth();
    const navigate = useNavigate();

    //console.log(session);

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true)
        try {
            const result = await signInUser(email, password);

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
        <form className="max-w-md m-auto pt-24" onSubmit={handleSignIn}>
        <h2 className="font-bold pb-2">Sign In</h2>
        <p>Don't have an account? <Link to='/signup'>Sign up!</Link></p>

        <div className="flex flex-col py-4">
            <input onChange={(e) => setEmail(e.target.value)} className="p-3 mt-2" type="email" placeholder="Email"/>
            <input onChange={(e) => setPassword(e.target.value)} className="p-3 mt-2" type="password" placeholder="Password"/>
            <button className="bg-blue-500 text-white p-3 mt-4 w-full" type="submit" disabled={loading}>Sign In</button>
            {error && <p className="text-red-500 text-center pt-4">{error}</p>}
        </div>

        </form>
    </div>
    );
    }

export default Signin;
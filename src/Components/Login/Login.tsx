
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Login.css";

import invisibleIcon from "/assets/icons/visibility-off.svg";
import visibleIcon from "/assets/icons/eye.svg";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [accountError, setAccountError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
   const [, setError] = useState<string | null>(null);

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGoogleSuccess = (credentialResponse: any) => {
      try {
        if (!credentialResponse.credential) {
          throw new Error("No credential received");
        }
  
        const userObject = jwtDecode(credentialResponse.credential);
        localStorage.setItem("simbiUser", JSON.stringify(userObject));
        navigate("/welcome");
      } catch (error) {
        console.error("Google sign-in error:", error);
        setError("Failed to sign in with Google. Please try again.");
      }
    };
  
    const handleGoogleFailure = () => {
      setError("Google sign-in was unsuccessful. Please try again.");
    };
    
  // Redirect if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      navigate("/login");
    }
  }, [navigate]);

  // Check for registration success from signup redirect
  useEffect(() => {
    if (location.state?.registrationSuccess) {
      setRegistrationSuccess(true);
      if (location.state?.registeredEmail) {
        setEmail(location.state.registeredEmail);
      }
      // Clear the state to prevent message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAccountError(false);
    setIsLoading(true);
    setGoogleError(null);

    try {
      const response = await fetch(
        "https://simbi-ai.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || "Login failed");
      }

      // Extract token from response data
      const token = resData.data.token;

      // Store token as plain string (no JSON.stringify)
      localStorage.setItem("authToken", token);

      // Optionally store user info if available
      // if (resData.data.user) {
      //   localStorage.setItem("user", JSON.stringify(resData.data.user.name));
      // }
      if (resData.data.user) {
  const user = resData.data.user;
  const simbiUser = {
    name: user.name || user.firstName || "User",
    avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name || "User")}`,
    // Include more fields if needed
  };
  localStorage.setItem("simbiUser", JSON.stringify(simbiUser));
  console.log(user)
}


      navigate("/welcome");
    } catch (error) {
      console.error("Login error:", error);
      setAccountError(true);

      let errorMessage = "Login failed. Please check your credentials.";
      if (error instanceof Error) {
        if (error.message.includes("User not found")) {
          errorMessage = "Account not found. Please sign up first.";
        } else if (error.message.includes("Invalid password")) {
          errorMessage = "Incorrect password. Please try again.";
        }
      }
      setGoogleError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <header className="login-header">
        <img
          src="/assets/icons/Simbi-logo.png"
          alt="Simbi Logo"
          className="logo"
        />
      </header>

      <div className="login-content">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Sign in to get access to unlimited learning</h2>

          {registrationSuccess && (
            <div className="success-message">
              Registration successful! Please log in to continue.
            </div>
          )}
          <div className="google-signin-container">
            <GoogleOAuthProvider clientId="6846893560-imp57m3r6aft7c9lpu4c7sor3tuf1oid.apps.googleusercontent.com">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleFailure}
                useOneTap
                text="signup_with"
                shape="pill"
                // width="450"
                logo_alignment="center"
              />
            </GoogleOAuthProvider>
          </div>
          {googleError && <div className="error-message">{googleError}</div>}

          <div className="divider-line-login">
            <span className="line-login"></span>
            <span className="divider-login">or with email</span>
            <span className="line-login"></span>
          </div>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-input-wrappers">
            <input
              className="sign-password-input-wrapper"
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <img
              src={showPassword ? visibleIcon : invisibleIcon}
              alt={showPassword ? "Hide password" : "Show password"}
              className="toggle-password-icon"
              onClick={togglePasswordVisibility}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && togglePasswordVisibility()}
              aria-label="Toggle password visibility"
            />
          </div>

          <label className="remember-me">
            <input
              type="checkbox"
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.target.checked)}
            />
            Keep me logged in
          </label>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Continue"}
          </button>

          {accountError && (
            <div className="account-alert">
              Account not found, please sign up first.
            </div>
          )}

          <button
            type="button"
            className="wallet-connect"
            onClick={() => navigate("/connect-wallet")}
          >
            Sign In With Wallet
          </button>

          <p className="redirect-signup">
            Don't have an account?{" "}
            <span onClick={() => navigate("/signup")}>Sign up</span>
          </p>
        </form>

        <img
          src="/assets/Simbi-hello.svg"
          alt="Simbi Character"
          className="login-illustration"
        />
      </div>
    </div>
  );
};

export default Login;
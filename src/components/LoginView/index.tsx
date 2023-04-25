import { useState } from "react";
import validator from "email-validator";
import { sendEmail } from './utils';
import ForgetPassword from "./ForgetPassword";

const LoginView: React.FC<{
  onLogin: () => void;
}> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setRePassword] = useState("");
  const [error, setError] = useState("");
  const [showSignUp, setShowSignUp] = useState(false);
  const [showVerificationStep, setShowVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [forgetPassword, setForgetPassword] = useState(false);


  const resetStates = () => {
    setEmail("");
    setPassword("");
    setRePassword("");
    setError("");
    setShowVerificationStep(false);
  };
  const handleLogin = async (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setError("");
    // Handle login logic here
    if (email === "" || password === "") {
      setError("请输入邮箱和密码");
      return;
    }

    // if (!validator.validate(email)) {
    //     setError("请输入正确的邮箱");
    //     return;
    // }

    // Login logic here
    const response = await fetch("/api/da-be", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ "api_name": "login", "email": email, "password": password}),
      });

      if (response.ok) {
        // Save JWT token into local storage
        const data = await response.json()
        const token = data.jwt_token
        localStorage.setItem('token', token)
        onLogin()
      } else {
        setError("邮箱密码不正确，请重新输入");
      }
  };

  const handleSignUpSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setError("");
    if (email === "" || password === "") {
      setError("请输入邮箱和密码");
      return;
    }
 
    if (!validator.validate(email)) {
        setError("请输入正确的邮箱");
        return;
    }

    if (password.length < 4) {
        setError("密码长度至少为4位");
        return;
    }

    if (repassword !== password) {
        setError("两次输入的密码不一致");
        return;
    }
    
    const code = await sendEmail(email);
    if (code === undefined || code === "") {
        setError("发送验证码失败，请重试");
        return;
    }

    setVerificationCode(code);
    setShowVerificationStep(true);
  }

  const toggleSignUp = () => {
    // Navigate to sign-up page or open sign-up modal
    setShowSignUp(!showSignUp);
    resetStates();
  };

  const handleCodeVerification = async () => {
    setError("");
    if (enteredCode === "") {
      setError("请输入验证码");
      return;
    }

    if (enteredCode !== verificationCode) {
        setError("验证码不正确");
        return;
    }

    // Sign up logic here
    const response = await fetch("/api/da-be", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ "api_name": "signup", "email": email, "password": password}),
      });

      if (response.ok) {
        // Save JWT token into local storage
        const data = await response.json()
        const token = data.jwt_token
        localStorage.setItem('token', token)
        onLogin()
      } else {
        // TODO: Handle error for existing user.
        setError("注册失败，请重试");
      }
  }

  // Render forget password page.
  if (forgetPassword) {
    return (<ForgetPassword inputEmail={email}
                            onBack={() => setForgetPassword(false)}
                            onLogin={onLogin} />)
  }

  return (
<div className="min-h-screen bg-white dark:bg-zinc-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    {!showVerificationStep ? (<div className="max-w-md w-full space-y-8">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-300">
          账号登录 / 注册
        </h2>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="rounded-md shadow-sm -space-y-px">
          {error && (
              <div className="text-center text-red-500 bg-red-100 p-2 rounded-md mb-4">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">
                邮箱
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border dark:border-zinc-800 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border dark:border-zinc-800 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {(showSignUp) && (<div>
              <label htmlFor="repassword" className="sr-only">
                再次输入密码
              </label>
              <input
                id="repassword"
                name="repassword"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border dark:border-zinc-800 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="再次输入密码"
                value={repassword}
                onChange={(e) => setRePassword(e.target.value)}
              />
            </div>)}
          </div>

          {(!showSignUp) && (<div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                type="button"
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-gray-400 hover:dark:text-gray-500"
                onClick={toggleSignUp}
              >
                还没有账号？点击注册
              </button>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-gray-400 hover:dark:text-gray-500"
                onClick={() => setForgetPassword(true)}
              >
                忘记密码
              </button>
            </div>
          </div>)}

          <div>
            <button
              type="submit"
              className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              style={{ marginBottom: '10px' }}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                event.preventDefault();
                showSignUp ? handleSignUpSubmit(event) : handleLogin(event);
              }}
            >
              {(showSignUp) ? '发送邮件验证码' : "登录"}
            </button>
            {(showSignUp) && (
                <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border dark:border-zinc-800 rounded-md text-sm font-medium text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                onClick={toggleSignUp}
                >
                返回
                </button>
            )}
          </div>
        </form>
      </div>) :

      (    <div className="max-w-md w-full space-y-8">
                  {error && (
              <div className="text-center text-red-500 bg-red-100 p-2 rounded-md mb-4">
                {error}
              </div>
            )}
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-300">
          验证邮箱
        </h2>
          <p className="text-sm text-gray-500">
            请输入您收到的邮箱验证码
          </p>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            placeholder="请输入验证码"
            value={enteredCode}
            onChange={(e) => setEnteredCode(e.target.value)}
          />
          <button
            type="button"
            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            onClick={handleCodeVerification}
          >
            确认
          </button>
          <button
        type="button"
        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
        onClick={ toggleSignUp}
            >
             返回
            </button>
          
          </div>)
}

      </div>
      )
};

export default LoginView;
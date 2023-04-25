import { useState } from "react";
import validator from "email-validator";
import { sendEmail } from './utils';

enum Step {
    Email,
    VerificationCode,
    Password,
}

const  ForgetPassword: React.FC<{
    inputEmail: string;
    onBack: () => void;
    onLogin: () => void;
  }> = ({ inputEmail, onBack, onLogin }) => {
    const [email, setEmail] = useState(inputEmail === undefined ? "" : inputEmail)
    const [password, setPassword] = useState("");
    const [repassword, setRePassword] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [enteredCode, setEnteredCode] = useState("");
    const [error, setError] = useState("");

    const [step, setStep] = useState(Step.Email);

    // After user enter their email
    // Check if the email is valid
    // If valid, send verification code to email
    // Navigate to verification code step.
    const submitEmail = async () => {
        setError("");
        if (!validator.validate(email)) {
            setError("请输入正确的邮箱");
            return;
        }
        
        const code = await sendEmail(email);
        if (code === undefined || code === "") {
            setError("发送验证码失败，请重试");
            return;
        }
        setVerificationCode(code);

        setStep(Step.VerificationCode);
    }

    // After user enter the verification code
    // Check if the code is valid
    // If valid, navigate to password step.
    const submitVerificationCode = () => {
        setError("");
        if (enteredCode === "") {
            setError("请输入验证码");
            return;
        }
    
        if (enteredCode !== verificationCode) {
            setError("验证码不正确");
            return;
        }

        setStep(Step.Password);
    }

    // After user enter their password
    // Check if the password is valid
    // If valid, update password.
    const submitPassword = async () => {
        setError("");
        if (password === "") {
            setError("请输入密码");
            return;
        }

        if (password.length < 4) {
            setError("密码长度至少为4位");
            return;
        }

        if (repassword === "") {
            setError("请再次输入密码");
            return;
        }

        if (password !== repassword) {
            setError("两次输入的密码不一致");
            return;
        }

        // Update password logic here.
        const response = await fetch("/api/da-be", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ "api_name": "change_password", "email": email, "password": password}),
          });
    
          if (response.ok) {
            // Save JWT token into local storage
            const data = await response.json()
            const token = data.jwt_token
            localStorage.setItem('token', token)
            onLogin()
          } else {
            // TODO: Handle error for existing user.
            setError("重设密码失败，请稍后重试");
          }
    }

    var body
    switch (step) {
        case Step.Email:
            body = (
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-300">
                    请输入您的邮箱
                    </h2>
                    <form className="mt-8 space-y-6" onSubmit={submitEmail}>
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
                        </div>
                    </form>
                </div>
            )
            break
        case Step.VerificationCode:
            body = (
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-300" style={{ marginBottom: '10px' }}>
                        验证邮箱
                    </h2>
                    {error && (
                        <div className="text-center text-red-500 bg-red-100 p-2 rounded-md mb-4">
                            {error}
                        </div>
                        )}
                    <p className="text-sm text-gray-500" style={{ margin: '10px' }}>
                        请输入您收到的邮箱验证码
                    </p>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type="text"
                        placeholder="请输入验证码"
                        value={enteredCode}
                        onChange={(e) => setEnteredCode(e.target.value)}
                    />
                </div>
            )
            break
        case Step.Password:
            body = (
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-300" style={{ marginBottom: '10px' }}>
                        重设新密码
                    </h2>
                    {error && (
                        <div className="text-center text-red-500 bg-red-100 p-2 rounded-md mb-4">
                            {error}
                        </div>
                        )}
                    <div>
                        <label htmlFor="password" className="sr-only">
                            新密码
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border dark:border-zinc-800 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="新密码"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="repassword" className="sr-only">
                            再次输入新密码
                        </label>
                        <input
                            id="repassword"
                            name="repassword"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border dark:border-zinc-800 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="再次输入新密码"
                            value={repassword}
                            onChange={(e) => setRePassword(e.target.value)}
                        />
                    </div>
                </div>
            )
            break
    }

    // Show verification step if the email is valid.
    return (
        <div className="min-h-screen bg-white dark:bg-zinc-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                { body }
                <div>
                    <button
                        type="button"
                        className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                        style={{ marginBottom: '10px' }}
                        onClick={() => {
                            switch (step) {
                                case Step.Email:
                                    submitEmail()
                                    break
                                case Step.VerificationCode:
                                    submitVerificationCode()
                                    break
                                case Step.Password:
                                    submitPassword()
                                    break
                            }
                        }}
                    >
                        确认
                    </button>
                    <button
                        type="submit"
                        className="group relative w-full flex justify-center py-2 px-4 border dark:border-zinc-800 rounded-md text-sm font-medium text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                        onClick={onBack}
                        >
                        返回登录页面
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ForgetPassword;
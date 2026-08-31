import { useState } from "react";
import "./Login.css";

function Login({ onLogin, onRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      setErrorMessage("กรุณากรอก Username และ Password");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const result = await onLogin(
      username.trim(),
      password
    );

    if (!result.success) {
      setErrorMessage(
        result.message ||
          "Username หรือ Password ไม่ถูกต้อง"
      );
    }

    setLoading(false);
  }

  return (
    <div className="loginPage">
      <form
        className="loginCard"
        onSubmit={handleSubmit}
      >
        <img
          src="/doa-logo.png"
          alt="Department of Airports"
          className="loginLogo"
        />

        <h1>เข้าสู่ระบบ</h1>
        <p>ระบบติดตามงานกองแผนงาน</p>

        <label htmlFor="username">
          Username
        </label>

        <input
          id="username"
          type="text"
          value={username}
          onChange={(event) =>
            setUsername(event.target.value)
          }
          placeholder="กรอก Username"
          autoComplete="username"
        />

        <label htmlFor="password">
          Password
        </label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          placeholder="กรอก Password"
          autoComplete="current-password"
        />

        {errorMessage && (
          <div className="loginError">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "กำลังเข้าสู่ระบบ..."
            : "เข้าสู่ระบบ"}
        </button>

        <button
          type="button"
          onClick={onRegister}
        >
          สมัครสมาชิก
        </button>
      </form>
    </div>
  );
}

export default Login;
import { useState } from "react";
import "./Login.css";

const API_URL =
  "https://script.google.com/macros/s/AKfycbx2DVOZKIOQ0ryjnJ1jOHbtG6rzrjGKyIfEbcdXrppIvDTlgkWq_vsZUjJjSUeKkha2/exec";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [usernameChecked, setUsernameChecked] = useState(false);
  const [needNewPassword, setNeedNewPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // STEP 1: ตรวจสอบ Username ก่อน
  async function handleCheckUsername(event) {
    event.preventDefault();

    if (!username.trim()) {
      setMessage("กรุณากรอก Username");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "checkUsername",
          username: username.trim(),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setMessage(result.message || "ไม่พบ Username นี้");
        return;
      }

      setUsernameChecked(true);

      if (Number(result.first_pass) === 0) {
        setNeedNewPassword(true);
      } else {
        setNeedNewPassword(false);
      }
    } catch (error) {
      console.error(error);
      setMessage("เชื่อมต่อระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  // Login ปกติ
  async function handleNormalLogin(event) {
    event.preventDefault();

    if (!password) {
      setMessage("กรุณากรอก Password");
      return;
    }

    setLoading(true);
    setMessage("");

    const result = await onLogin(
      username.trim(),
      password
    );

    if (!result.success) {
      setMessage(
        result.message ||
          "Username หรือ Password ไม่ถูกต้อง"
      );
    }

    setLoading(false);
  }

  // หลัง Reset → ตั้ง Password ใหม่
  async function handleNewPassword(event) {
    event.preventDefault();

    if (password.length < 6) {
      setMessage(
        "Password ต้องมีอย่างน้อย 6 ตัวอักษร"
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Password ไม่ตรงกัน");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "setPassword",
          username: username.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setMessage(
          result.message ||
            "ตั้ง Password ไม่สำเร็จ"
        );
        return;
      }

      // ตั้ง Password เสร็จ → Login ทันที
      const loginResult = await onLogin(
        username.trim(),
        password
      );

      if (!loginResult.success) {
        setMessage(
          loginResult.message ||
            "เข้าสู่ระบบไม่สำเร็จ"
        );
      }
    } catch (error) {
      console.error(error);
      setMessage("เชื่อมต่อระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  // ถ้ายังไม่ได้ตรวจ Username
  // Submit = ตรวจ Username
  // ถ้าตรวจแล้วให้เลือก Login / Reset Password
  function handleSubmit(event) {
    if (!usernameChecked) {
      handleCheckUsername(event);
      return;
    }

    if (needNewPassword) {
      handleNewPassword(event);
    } else {
      handleNormalLogin(event);
    }
  }

  // เมื่อแก้ Username ต้องตรวจสอบใหม่
  function handleChangeUsername(event) {
    setUsername(event.target.value);

    setUsernameChecked(false);
    setNeedNewPassword(false);
    setPassword("");
    setConfirmPassword("");
    setMessage("");
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

        {/* Username แสดงตลอด */}
        <label htmlFor="username">
          Username
        </label>

        <input
          id="username"
          type="text"
          value={username}
          onChange={handleChangeUsername}
          placeholder="กรอก Username"
          autoComplete="username"
          disabled={loading}
        />

        {/* หลังตรวจ Username แล้วเท่านั้น */}
        {usernameChecked && (
          <>
            <label htmlFor="password">
              {needNewPassword
                ? "ตั้ง Password ใหม่"
                : "Password"}
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder={
                needNewPassword
                  ? "กรอก Password ใหม่"
                  : "กรอก Password"
              }
              autoComplete={
                needNewPassword
                  ? "new-password"
                  : "current-password"
              }
              disabled={loading}
            />

            {/* ถูก Reset เท่านั้นถึงแสดง Confirm */}
            {needNewPassword && (
              <>
                <label htmlFor="confirmPassword">
                  ยืนยัน Password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="กรอก Password อีกครั้ง"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </>
            )}
          </>
        )}

        {message && (
          <div className="loginError">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "กำลังดำเนินการ..."
            : !usernameChecked
            ? "ถัดไป"
            : needNewPassword
            ? "ตั้ง Password และเข้าสู่ระบบ"
            : "เข้าสู่ระบบ"}
        </button>
      </form>
    </div>
  );
}

export default Login;
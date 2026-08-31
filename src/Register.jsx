import { useState } from "react";
import "./Login.css";

function Register({ onBack }) {
  const [username, setUsername] = useState("");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  


async function handleSubmit(event) {
  event.preventDefault();

  // ตรวจสอบข้อมูล
  if (!username || !password || !confirmPassword) {
    setMessage("กรุณากรอกข้อมูลให้ครบ");
    return;
  }

  // ตรวจสอบความยาว Password
  if (password.length < 6) {
    setMessage("Password ต้องมีอย่างน้อย 6 ตัวอักษร");
    return;
  }

  // ตรวจสอบ Password ให้ตรงกัน
  if (password !== confirmPassword) {
    setMessage("Password ไม่ตรงกัน");
    return;
  }

  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbx2DVOZKIOQ0ryjnJ1jOHbtG6rzrjGKyIfEbcdXrppIvDTlgkWq_vsZUjJjSUeKkha2/exec",
      {
        method: "POST",
        body: JSON.stringify({
          action: "setPassword",
          username: username.trim(),
          password: password,
        }),
      }
    );

    const result = await response.json();

    // ตรวจสอบผลลัพธ์จาก API
    if (!result.success) {
      setMessage(
        result.message || "ตั้ง Password ไม่สำเร็จ"
      );

      return;
    }

    // ตั้ง Password สำเร็จ
    setMessage(
      "ตั้ง Password สำเร็จ สามารถกลับไปเข้าสู่ระบบได้แล้ว"
    );

    // ล้างข้อมูลใน Form
    setUsername("");
    setPassword("");
    setConfirmPassword("");
  } catch (error) {
    console.error("Set password error:", error);

    setMessage("เชื่อมต่อระบบไม่สำเร็จ");
  }
}
    

   

  return (
    <div className="loginPage">
      <form className="loginCard" onSubmit={handleSubmit}>
        <img
          src="/doa-logo.png"
          className="loginLogo"
          alt="DOA"
        />

        <h1>สมัครสมาชิก</h1>

        <p>ระบบติดตามงานกองแผนงาน</p>

        <label>Username</label>

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="สร้าง Username"
        />

       

        <label>Password</label>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="สร้าง Password"
        />

        <label>ยืนยัน Password</label>

        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="กรอก Password อีกครั้ง"
        />

        {message && (
          <div className="loginError">
            {message}
          </div>
        )}

        <button type="submit">
          สมัครสมาชิก
        </button>

        <button
          type="button"
          onClick={onBack}
        >
          กลับหน้า Login
        </button>
      </form>
    </div>
  );
}

export default Register;
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import Home from "./Home";
import Login from "./Login";
// ===============================
// Apps Script URL
// ===============================
const API_URLS = 
  "https://script.google.com/macros/s/AKfycbx2DVOZKIOQ0ryjnJ1jOHbtG6rzrjGKyIfEbcdXrppIvDTlgkWq_vsZUjJjSUeKkha2/exec";



// ===============================
// App Component
// ===============================
function App() {
  const [user, setUser] = useState(null);
  const [checkingLogin, setCheckingLogin] = useState(true);

  useEffect(() => {
    const savedUser = sessionStorage.getItem("loggedInUser");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error(
          "อ่านข้อมูลผู้ใช้ไม่สำเร็จ:",
          error
        );

        sessionStorage.removeItem("loggedInUser");
      }
    }

    setCheckingLogin(false);
  }, []);

  async function handleLogin(username, password) {
  try {
    const response = await fetch(API_URLS, {
      method: "POST",
      body: JSON.stringify({
        action: "login",
        username,
        password,
      }),
    });

    const result = await response.json();

    if (result.success) {
      setUser(result.user);

      sessionStorage.setItem(
        "loggedInUser",
        JSON.stringify(result.user)
      );
    }

    return result;
  } catch (error) {
    console.error("Login error:", error);

    return {
      success: false,
      message: "เชื่อมต่อระบบ Login ไม่สำเร็จ",
    };
  }
}

  function handleLogout() {
    sessionStorage.removeItem("loggedInUser");
    setUser(null);
  }

  if (checkingLogin) {
    return (
      <div className="login-checking">
        กำลังตรวจสอบการเข้าสู่ระบบ...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Home
      user={user}
      onLogout={handleLogout}
    />
  );
}

// ===============================
// Empty State
// ===============================
function EmptyState() {
  return (
    <div className="empty-state">
      <h2>กรุณาเลือกเมนูทางซ้าย</h2>
      <p>ระบบจะแสดงข้อมูลที่นี่</p>
    </div>
  );
}

// ===============================
// Iframe Viewer
// ===============================
function IframeViewer({ item }) {
  return (
    <iframe
      title={item.name}
      src={item.url}
      width="100%"
      height="100%"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}

// ===============================
// Plan Work Table
// ===============================
function PlanWorkTable({ apiUrl }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const loadData = async () => {
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(
          "โหลดข้อมูลไม่สำเร็จ รหัส " + response.status
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.error || "ไม่พบข้อมูลจาก Google Sheet"
        );
      }

      setRows(Array.isArray(result.rows) ? result.rows : []);
      setErrorMessage("");
      setLastUpdated(
        new Date().toLocaleTimeString("th-TH")
      );
    } catch (error) {
      console.error("Load sheet error:", error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const timer = setInterval(() => {
      loadData();
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, [apiUrl]);

  const filteredRows = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) {
      return rows;
    }

    return rows.filter((row) => {
      const combinedText = [
        row.receiveNumber,
        row.subject,
        row.workGroup,
        row.dateTime,
        row.remark,
        row.attachmentText
      ]
        .join(" ")
        .toLowerCase();

      return combinedText.includes(keyword);
    });
  }, [rows, searchText]);

    return (
    <div className="sheet-page">
      <div className="sheet-header">
        <div>
          <h2>ตารางงาน กองแผนงาน ปี 2569</h2>

          <p className="sheet-status">
            อัปเดตล่าสุด: {lastUpdated || "-"}
          </p>
        </div>

        <div className="sheet-actions">
          <input
            type="text"
            className="search-input"
            placeholder="ค้นหาเรื่อง กลุ่มงาน หรือเลขรับ"
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
          />

          <button
            type="button"
            className="refresh-button"
            onClick={loadData}
          >
            รีเฟรชข้อมูล
          </button>
        </div>
      </div>

      {loading ? (
        <div className="status-box">
          กำลังโหลดข้อมูล...
        </div>
      ) : errorMessage ? (
        <div className="error-box">
          <p>{errorMessage}</p>

          <button
            type="button"
            onClick={loadData}
          >
            ลองใหม่
          </button>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="status-box">
          ไม่พบข้อมูล
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="plan-table">
            <thead>
              <tr>
                <th className="receive-column">
                  เลขรับ กองแผน / ว/ด/ป
                </th>

                <th className="subject-column">
                  เรื่อง
                </th>

                <th className="group-column">
                  กลุ่มงาน
                </th>

                <th className="datetime-column">
                  ว/ด/ป - เวลา
                </th>

                <th className="remark-column">
                  หมายเหตุ
                </th>

                <th className="attachment-column">
                  เอกสารแนบ
                </th>
              </tr>
            </thead>
<tbody>
  {filteredRows.map((row, index) => (
    <tr key={`${row.receiveNumber}-${index}`}>

      <td data-label="เลขรับ กองแผน / ว/ด/ป">
        {row.receiveNumber || "-"}
      </td>

      <td
        className="text-left"
        data-label="เรื่อง"
      >
        {row.subject || "-"}
      </td>

      <td data-label="กลุ่มงาน">
        {row.workGroup || "-"}
      </td>

      <td
        className="text-left"
        data-label="ว/ด/ป - เวลา"
      >
        {row.dateTime || "-"}
      </td>

      <td
        className="remark-cell"
        data-label="หมายเหตุ"
      >
        {row.remark || "-"}
      </td>

      <td
        className="text-left"
        data-label="เอกสารแนบ"
      >
        <AttachmentCell row={row} />
      </td>

    </tr>
  ))}
</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ===============================
// Attachment Cell
// ===============================
function AttachmentCell({ row }) {
  // ถ้ามี URL ของไฟล์แนบ ให้แสดงลิงก์
  if (row.attachmentUrl) {
    return (
      <a
        href={row.attachmentUrl}
        target="_blank"
        rel="noreferrer"
        className="attachment-link"
      >
        เปิดเอกสาร
      </a>
    );
  }

  // ถ้าไม่มีข้อความไฟล์แนบ
  if (!row.attachmentText) {
    return <span>-</span>;
  }

  // แสดงข้อความในกรณีที่ไม่มีลิงก์
  return (
    <span className="attachment-text">
      {row.attachmentText}
    </span>
  );
}

// ===============================
// Export
// ===============================
export default App;
import { useEffect, useState } from "react";
import "./UserManagement.css";

const API_URLS =
  "https://script.google.com/macros/s/AKfycbx2DVOZKIOQ0ryjnJ1jOHbtG6rzrjGKyIfEbcdXrppIvDTlgkWq_vsZUjJjSUeKkha2/exec";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(
        `${API_URLS}?action=listUsers`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `โหลดข้อมูลไม่สำเร็จ รหัส ${response.status}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message ||
            "โหลดรายชื่อผู้ใช้ไม่สำเร็จ"
        );
      }

      setUsers(
        Array.isArray(result.users)
          ? result.users
          : []
      );
    } catch (error) {
      console.error("Load users error:", error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function checkActive(value) {
    return (
      value === true ||
      String(value).toUpperCase() === "TRUE"
    );
  }

  return (
  <div className="userManagementPage">
    <div className="userManagementHeader">
      <div>
        <h1>จัดการผู้ใช้งาน</h1>
        <p>จำนวนผู้ใช้ทั้งหมด {users.length} คน</p>
      </div>

      <div className="userHeaderButtons">
        <button
          type="button"
          className="addUserButton"
        >
          + เพิ่มผู้ใช้
        </button>

        <button
          type="button"
          className="refreshUserButton"
          onClick={loadUsers}
          disabled={loading}
        >
          {loading
            ? "กำลังโหลด..."
            : "รีเฟรช"}
        </button>
      </div>
    </div>

    {loading ? (
      <div className="userStatusBox">
        กำลังโหลดรายชื่อผู้ใช้...
      </div>
    ) : errorMessage ? (
      <div className="userErrorBox">
        <p>{errorMessage}</p>

        <button
          type="button"
          onClick={loadUsers}
        >
          ลองใหม่
        </button>
      </div>
    ) : users.length === 0 ? (
      <div className="userStatusBox">
        ยังไม่มีผู้ใช้งาน
      </div>
    ) : (
      <div className="userTableWrapper">
        <table className="userTable">
          <thead>
            <tr>
              <th>Username</th>
              <th>ชื่อ</th>
              <th>สิทธิ์</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => {
              const active = checkActive(user.active);

              return (
                <tr key={user.username}>
                  <td>{user.username || "-"}</td>

                  <td>{user.name || "-"}</td>

                  <td>
                    <span
                      className={
                        user.role === "admin"
                          ? "roleBadge adminRole"
                          : "roleBadge userRole"
                      }
                    >
                      {user.role || "user"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        active
                          ? "activeBadge"
                          : "inactiveBadge"
                      }
                    >
                      {active
                        ? "เปิดใช้งาน"
                        : "ปิดใช้งาน"}
                    </span>
                  </td>

                  <td>
                    <div className="userActionButtons">
                      <button
                        type="button"
                        className="editUserButton"
                      >
                        แก้ไข
                      </button>

                      <button
                        type="button"
                        className="deleteUserButton"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
}
export default UserManagement;
import { useEffect, useState } from "react";
import "./UserManagement.css";

const API_URLS =
  "https://script.google.com/macros/s/AKfycbx2DVOZKIOQ0ryjnJ1jOHbtG6rzrjGKyIfEbcdXrppIvDTlgkWq_vsZUjJjSUeKkha2/exec";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // ===============================
  // Add User
  // ===============================

  const [showAddForm, setShowAddForm] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [addMessage, setAddMessage] = useState("");
  const [deletingUser, setDeletingUser] = useState("");

  const [newUser, setNewUser] = useState({
    username: "",
    
    name: "",
    role: "user",
    active: false,
  });

  // ===============================
  // Edit User
  // ===============================

  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [editActive, setEditActive] = useState(true);
  const [editPassword, setEditPassword] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMessage, setEditMessage] = useState("");

  // ===============================
  // Load Users
  // ===============================

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

      setErrorMessage(
        error.message ||
          "โหลดรายชื่อผู้ใช้ไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // ===============================
  // Active Helper
  // ===============================

  function checkActive(value) {
    return (
      value === true ||
      String(value).toUpperCase() === "TRUE"
    );
  }

  // ===============================
  // Add User
  // ===============================

  function handleAddInput(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setNewUser((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  function openAddForm() {
    setEditingUser(null);
    setEditMessage("");

    setShowAddForm(true);
    setAddMessage("");
  }

  function closeAddForm() {
    setShowAddForm(false);
    setAddMessage("");

    setNewUser({
      username: "",
      
      name: "",
      role: "user",
      active: false,
    });
  }

  async function handleAddUser(event) {
    event.preventDefault();

    if (!newUser.username.trim()) {
      setAddMessage("กรุณากรอก Username");
      return;
    }

    if (!newUser.name.trim()) {
      setAddMessage("กรุณากรอกชื่อ");
      return;
    }

    

    try {
      setSavingAdd(true);
      setAddMessage("");

      const response = await fetch(API_URLS, {
        method: "POST",
        body: JSON.stringify({
          action: "addUser",
          username: newUser.username.trim(),
          
          name: newUser.name.trim(),
          role: newUser.role,
          active: false,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message ||
            "เพิ่มผู้ใช้ไม่สำเร็จ"
        );
      }

      setNewUser({
        username: "",
        
        name: "",
        role: "user",
        active: false,
      });

      setShowAddForm(false);

      await loadUsers();
    } catch (error) {
      console.error(
        "Add user error:",
        error
      );

      setAddMessage(
        error.message ||
          "เพิ่มผู้ใช้ไม่สำเร็จ"
      );
    } finally {
      setSavingAdd(false);
    }
  }

  // ===============================
  // Edit User
  // ===============================

  function startEdit(user) {
    setShowAddForm(false);
    setAddMessage("");

    setEditingUser(user.username);
    setEditName(user.name || "");
    setEditRole(user.role || "user");
    setEditActive(
      checkActive(user.active)
    );

    setEditPassword("");
    setEditMessage("");
  }

  function cancelEdit() {
    setEditingUser(null);
    setEditPassword("");
    setEditMessage("");
  }

  async function saveEdit(event) {
    event.preventDefault();

    if (!editName.trim()) {
      setEditMessage("กรุณากรอกชื่อ");
      return;
    }

    if (
      editPassword &&
      editPassword.length < 6
    ) {
      setEditMessage(
        "Password ต้องมีอย่างน้อย 6 ตัวอักษร"
      );
      return;
    }

    try {
      setSavingEdit(true);
      setEditMessage("");

      const response = await fetch(API_URLS, {
        method: "POST",
        body: JSON.stringify({
          action: "updateUser",
          username: editingUser,
          name: editName.trim(),
          role: editRole,
          active: editActive,
          password: editPassword,
        }),
      });

      const result =
        await response.json();

      if (!result.success) {
        throw new Error(
          result.message ||
            "แก้ไขผู้ใช้ไม่สำเร็จ"
        );
      }

      setEditingUser(null);
      setEditPassword("");

      await loadUsers();
    } catch (error) {
      console.error(
        "Update user error:",
        error
      );

      setEditMessage(
        error.message ||
          "แก้ไขผู้ใช้ไม่สำเร็จ"
      );
    } finally {
      setSavingEdit(false);
    }
  }


  // delete user function
  async function handleDeleteUser(user) {
  const confirmed = window.confirm(
    `ต้องการลบผู้ใช้ "${user.username}" ใช่หรือไม่?`
  );

  if (!confirmed) {
    return;
  }

  try {
    setDeletingUser(user.username);

    const response = await fetch(API_URLS, {
      method: "POST",
      body: JSON.stringify({
        action: "deleteUser",
        username: user.username,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(
        result.message || "ลบผู้ใช้ไม่สำเร็จ"
      );
    }

    if (editingUser === user.username) {
      cancelEdit();
    }

    await loadUsers();
  } catch (error) {
    alert(error.message || "ลบผู้ใช้ไม่สำเร็จ");
  } finally {
    setDeletingUser("");
  }
}

  // ===============================
// Render
// ===============================

return (
  <div className="userManagementPage">
    <div className="userManagementHeader">
      <div>
        <h1>จัดการผู้ใช้งาน</h1>

        <p>
          จำนวนผู้ใช้ทั้งหมด {users.length} คน
        </p>
      </div>

      <div className="userHeaderButtons">
        <button
          type="button"
          className="addUserButton"
          onClick={openAddForm}
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

    {/* ===============================
        Add User Form
    =============================== */}

    {showAddForm && (
      <div className="addUserPanel">
        <div className="addUserPanelHeader">
          <h2>เพิ่มผู้ใช้ใหม่</h2>

          <button
            type="button"
            className="closeUserFormButton"
            onClick={closeAddForm}
          >
            ×
          </button>
        </div>

        <form
          className="addUserForm"
          onSubmit={handleAddUser}
        >
          <div className="userFormField">
            <label>Username</label>

            <input
              type="text"
              name="username"
              value={newUser.username}
              onChange={handleAddInput}
              placeholder="กรอก Username"
              required
            />
          </div>

          

          <div className="userFormField">
            <label>ชื่อ</label>

            <input
              type="text"
              name="name"
              value={newUser.name}
              onChange={handleAddInput}
              placeholder="ชื่อผู้ใช้งาน"
              required
            />
          </div>

          <div className="userFormField">
            <label>สิทธิ์</label>

            <select
              name="role"
              value={newUser.role}
              onChange={handleAddInput}
            >
              <option value="user">
                User
              </option>

              <option value="admin">
                Admin
              </option>
            </select>
          </div>

        
     
          {addMessage && (
            <div className="userFormError">
              {addMessage}
            </div>
          )}
    
          <div className="addUserFormButtons">
            <button
              type="button"
              className="cancelUserButton"
              onClick={closeAddForm}
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="saveUserButton"
              disabled={savingAdd}
            >
              {savingAdd
                ? "กำลังบันทึก..."
                : "บันทึกผู้ใช้"}
            </button>
          </div>
        </form>
      </div>
    )}

        {/* ===============================
        Edit User Form
    =============================== */}

    {editingUser && (
      <div className="editUserPanel">
        <h2>
          แก้ไขผู้ใช้: {editingUser}
        </h2>

        <form
          className="editUserForm"
          onSubmit={saveEdit}
        >
          <div className="userFormField">
            <label>Username</label>

            <input
              type="text"
              value={editingUser}
              disabled
            />
          </div>

          <div className="userFormField">
            <label>ชื่อ</label>

            <input
              type="text"
              value={editName}
              onChange={(event) =>
                setEditName(event.target.value)
              }
              required
            />
          </div>

          <div className="userFormField">
            <label>สิทธิ์</label>

            <select
              value={editRole}
              onChange={(event) =>
                setEditRole(event.target.value)
              }
            >
              <option value="user">
                User
              </option>

              <option value="admin">
                Admin
              </option>
            </select>
          </div>

          <div className="userFormField">
            <label>Password ใหม่</label>

            <input
              type="password"
              value={editPassword}
              onChange={(event) =>
                setEditPassword(
                  event.target.value
                )
              }
              placeholder="ไม่เปลี่ยนให้เว้นว่าง"
            />
          </div>

          <label className="activeUserCheckbox">
            <input
              type="checkbox"
              checked={editActive}
              onChange={(event) =>
                setEditActive(
                  event.target.checked
                )
              }
            />

            เปิดใช้งานบัญชี
          </label>

          {editMessage && (
            <div className="userFormError">
              {editMessage}
            </div>
          )}

          <div className="editUserButtons">
            <button
              type="button"
              onClick={cancelEdit}
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={savingEdit}
            >
              {savingEdit
                ? "กำลังบันทึก..."
                : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    )}

    {/* ===============================
        Users Table
    =============================== */}

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
              const active = checkActive(
                user.active
              );

              return (
                <tr key={user.username}>
                  <td>
                    {user.username || "-"}
                  </td>

                  <td>
                    {user.name || "-"}
                  </td>

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
                        onClick={() =>
                          startEdit(user)
                        }
                      >
                        แก้ไข
                      </button>

                      <button
  type="button"
  className="deleteUserButton"
  onClick={() => handleDeleteUser(user)}
  disabled={deletingUser === user.username}
>
  {deletingUser === user.username
    ? "กำลังลบ..."
    : "ลบ"}
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
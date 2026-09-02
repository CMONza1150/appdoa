import { useEffect, useState } from "react";
import "./UserManagement.css";

const API_URLS =
  "https://script.google.com/macros/s/AKfycbx2DVOZKIOQ0ryjnJ1jOHbtG6rzrjGKyIfEbcdXrppIvDTlgkWq_vsZUjJjSUeKkha2/exec";

const PAGE_PERMISSIONS = [
  {
    value: "home",
    label: "หน้าหลัก",
  },
  {
    value: "director",
    label: "ผอ.กผง",
  },
  {
    value: "fbt",
    label: "ฝบท.",
  },
  {
    value: "kyng",
    label: "กยง.",
  },
  {
    value: "kph",
    label: "กพข.",
  },
  {
    value: "kwr",
    label: "กวร.",
  },
  {
    value: "ktp",
    label: "กตป.",
  },
  {
    value: "kws",
    label: "กวส.",
  },
];

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
  const [resettingUser, setResettingUser] = useState("");

  const [newUser, setNewUser] = useState({
    username: "",
    
    name: "",
    role: "user",
    permissions: ["home"],
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
  const [editPermissions, setEditPermissions] = useState([]);


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

  function handleAddPermission(permission) {
  setNewUser((previous) => {
    const alreadySelected =
      previous.permissions.includes(permission);
       
    return {
      ...previous,
      permissions: alreadySelected
        ? previous.permissions.filter(
            (item) => item !== permission
          )
        : [...previous.permissions, permission],
    };
  });
}

function handleEditPermission(permission) {
  setEditPermissions((previous) => {
    const alreadySelected =
      previous.includes(permission);

    return alreadySelected
      ? previous.filter(
          (item) => item !== permission
        )
      : [...previous, permission];
  });
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
      permissions: ["home"],
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
          permissions: newUser.role === "admin" ? ["all"] : newUser.permissions,
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
        permissions: ["home"],
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

  let userPermissions = [];

  if (Array.isArray(user.permissions)) {
    userPermissions = user.permissions;
  } else if (typeof user.permissions === "string") {
    userPermissions = user.permissions
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  setEditPermissions(userPermissions);

  setEditActive(
    checkActive(user.active)
  );

  setEditPassword("");
  setEditMessage("");
}

  function cancelEdit() {
    setEditingUser(null);
    setEditPassword("");
    setEditPermissions([]);
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
          permissions: editRole === "admin" ? ["all"] : editPermissions,
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


async function handleResetPassword(user) {
  const confirmed = window.confirm(
    `ต้องการ Reset Password ของ "${user.username}" ใช่หรือไม่?\n\n` +
      "ผู้ใช้นี้จะต้องตั้ง Password ใหม่ก่อนเข้าสู่ระบบ"
  );

  if (!confirmed) {
    return;
  }

  try {
    setResettingUser(user.username);

    const response = await fetch(API_URLS, {
      method: "POST",
      body: JSON.stringify({
        action: "resetPassword",
        username: user.username,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(
        result.message || "Reset Password ไม่สำเร็จ"
      );
    }

    alert(
      "Reset Password สำเร็จ\nผู้ใช้ต้องตั้ง Password ใหม่"
    );

    await loadUsers();
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    alert(
      error.message || "Reset Password ไม่สำเร็จ"
    );
  } finally {
    setResettingUser("");
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
  <label>ประเภทผู้ใช้งาน</label>

  <select
    name="role"
    value={newUser.role}
    onChange={handleAddInput}
  >
    <option value="user">User</option>
    <option value="admin">Admin</option>
  </select>
</div>


{newUser.role === "user" && (
  <div className="userFormField">
    <label>สิทธิ์เข้าถึงหน้า</label>

    <div className="permissionCheckboxGroup">
      {PAGE_PERMISSIONS.map((permission) => (
        <label
          key={permission.value}
          className="permissionCheckbox"
        >
          <input
            type="checkbox"
            checked={newUser.permissions.includes(
              permission.value
            )}
            onChange={() =>
              handleAddPermission(permission.value)
            }
          />

          <span>{permission.label}</span>
        </label>
      ))}
    </div>
  </div>
)}


        
     
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
  <label>ประเภทผู้ใช้งาน</label>

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


{editRole === "user" && (
  <div className="userFormField">
    <label>สิทธิ์เข้าถึงหน้า</label>

    <div className="permissionCheckboxGroup">
      {PAGE_PERMISSIONS.map((permission) => (
        <label
          key={permission.value}
          className="permissionCheckbox"
        >
          <input
            type="checkbox"
            checked={editPermissions.includes(
              permission.value
            )}
            onChange={() =>
              handleEditPermission(permission.value)
            }
          />

          <span>{permission.label}</span>
        </label>
      ))}
    </div>
  </div>
)}



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
              <th>สถานะ Password</th>
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
  {Number(user.first_pass) === 1 ? (
    <span className="activeBadge">
      พร้อมใช้งาน
    </span>
  ) : (
    <span className="inactiveBadge">
      รอตั้ง Password
    </span>
  )}
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

 <button
    type="button"
    className="resetPasswordButton"
    onClick={() => handleResetPassword(user)}
    disabled={resettingUser === user.username}
  >
    {resettingUser === user.username
      ? "กำลังรีเซ็ต..."
      : "Reset Password"}
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
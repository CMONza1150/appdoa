import { useEffect, useState } from "react";
import "./LinkManagement.css";

const API_URL = "https://script.google.com/macros/s/AKfycbx2DVOZKIOQ0ryjnJ1jOHbtG6rzrjGKyIfEbcdXrppIvDTlgkWq_vsZUjJjSUeKkha2/exec";



function LinkManagement() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    category: "",
    permission: ["all"],
    status: "active",
  });

  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);

  const fetchLinks = async () => {
    try {
      const res = await fetch(`${API_URL}?action=listLinks`);

      const data = await res.json();

      if (data.success) {
        setLinks(data.links);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: editingLink ? "updateLink" : "addLink",
        id: editingLink ? editingLink.id : null,
        ...formData
      })
    });

    const data = await res.json();

    if (data.success) {
      alert(editingLink ? "แก้ไข Link สำเร็จ" : "เพิ่ม Link สำเร็จ");

      setShowModal(false);
      setEditingLink(null);

      setFormData({
        name: "",
        url: "",
        category: "",
        permission: ["all"],
        status: "active",
      });

      fetchLinks();
    }
  } catch (error) {
    console.log(error);
  }
};

const editLink = (link) => {
  setSelectedLink(link);

  setFormData({
    name: link.name,
    url: link.url,
    category: link.category,
    permission: link.permission || ["all"],
    status: link.status,
  });

  setShowModal(true);
};

const handleDelete = async (id) => {
  const confirmDelete = window.confirm(
    "ต้องการลบ Link นี้หรือไม่?"
  );

  if (!confirmDelete) {
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "deleteLink",
        id: id,
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert("ลบ Link สำเร็จ");

      fetchLinks();
    }
  } catch (error) {
    console.log(error);
  }
};




  // Render the component
  return (
    <div className="linkManagement">
      <div className="linkHeader">

        <div>
         <h1>จัดการ Link</h1>
         <p>
           จำนวน Link ทั้งหมด {links.length} รายการ
         </p>
        </div>

        <button
  className="addLinkButton"
  onClick={() => {
    setEditingLink(null);

    setFormData({
      name: "",
      url: "",
      category: "",
      permission: ["all"],
      status: "active",
    });

    setShowModal(true);
  }}
>
  + เพิ่ม Link
</button>

       



     </div>

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <table className="linkTable">
          <thead>
            <tr>
              <th>ID</th>
              <th>ชื่อ Link</th>
              <th>URL</th>
              <th>Category</th>
              <th>Status</th>
              <th>Permission</th>
              <th>จัดการ</th>
            </tr>
          </thead>

          <tbody>
            {links.map((link) => (
              <tr key={link.id}>
                <td>{link.id}</td>
            
                <td>
                  {link.name}
                </td>

                <td>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    เปิด Link
                  </a>
                </td>

                <td>
                  {link.category}
                </td>

                <td>
                    <span className="statusActive">
                  {link.status}</span>
                </td>
               
               <td>{link.permission?.join(", ")}</td>
                
                
                <td>          

<button
className="editButton"
onClick={() => {
setEditingLink(link);

setFormData({
name: link.name || "",
url: link.url || "",
category: link.category || "",
permission: Array.isArray(link.permission)
? link.permission
: String(link.permission || "")
.split(",")
.map((item) => item.trim())
.filter(Boolean),
status: link.status || "active",
});

setShowModal(true);
}}
>
แก้ไข
</button>



                  <button
                    className="deleteButton"
                    onClick={() => handleDelete(link.id)}
                  >
                    ลบ
                  </button>
            
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
  <div className="modalOverlay">
    <div className="linkModal">
      <h2>
        {editingLink ? "แก้ไข Link" : "เพิ่ม Link"}
      </h2>

      <input
        placeholder="ชื่อ Link"
        value={formData.name}
        onChange={(e) =>
          setFormData({
            ...formData,
            name: e.target.value,
          })
        }
      />

      <input
        placeholder="URL"
        value={formData.url}
        onChange={(e) =>
          setFormData({
            ...formData,
            url: e.target.value,
          })
        }
      />

      <input
        placeholder="Category"
        value={formData.category}
        onChange={(e) =>
          setFormData({
            ...formData,
            category: e.target.value,
          })
        }
      />

      <div className="permissionSection">
  <div className="permissionTitle">
    Permission
  </div>

  <div className="permissionGrid">
    {[
      ["director", "ผอ.กผง"],
      ["fbt", "ฝบท."],
      ["kyng", "กยง."],
      ["kph", "กพข."],
      ["kwr", "กวร."],
      ["ktp", "กตป."],
      ["kws", "กวส."],
    ].map(([value, label]) => (
      <label
        key={value}
        className={
          formData.permission.includes(value)
            ? "permissionOption selected"
            : "permissionOption"
        }
      >
        <input
          type="checkbox"
          checked={formData.permission.includes(value)}
          disabled={formData.permission.includes("all")}
          onChange={() => {
            const permission = formData.permission.includes(value)
              ? formData.permission.filter(
                  (item) => item !== value
                )
              : [
                  ...formData.permission.filter(
                    (item) => item !== "all"
                  ),
                  value,
                ];

            setFormData({
              ...formData,
              permission,
            });
          }}
        />

        <span>{label}</span>
      </label>
    ))}

    <label
      className={
        formData.permission.includes("all")
          ? "permissionOption permissionAll selected"
          : "permissionOption permissionAll"
      }
    >
      <input
        type="checkbox"
        checked={formData.permission.includes("all")}
        onChange={(e) => {
          setFormData({
            ...formData,
            permission: e.target.checked
              ? ["all"]
              : [],
          });
        }}
      />

      <span>ทุกแผนก</span>
    </label>
  </div>
</div>

      <select
        value={formData.status}
        onChange={(e) =>
          setFormData({
            ...formData,
            status: e.target.value,
          })
        }
      >
        <option value="active">
          active
        </option>

        <option value="inactive">
          inactive
        </option>
      </select>

      <div className="modalActions">
  <button
    type="button"
    className="cancelButton"
    onClick={() => {
      setShowModal(false);
      setEditingLink(null);
    }}
  >
    ยกเลิก
  </button>

  <button
    type="button"
    className="saveButton"
    onClick={handleSubmit}
  >
    บันทึก
  </button>
</div>
    </div>
  </div>
)}
    </div>

    
  );
  



}

export default LinkManagement;


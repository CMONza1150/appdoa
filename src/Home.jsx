import { useEffect, useRef ,useState ,useMemo} from "react";
import "./Home.css";
import UserManagement from "./UserManagement";
import LinkManagement from "./LinkManagement";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Tooltip,
  ResponsiveContainer,
  Legend,
  XAxis,
  YAxis,
  Bar,
  CartesianGrid,
} from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// URLs ของ google sheet ตารางงานกองแผนงาน //
const API_URLS = 
"https://script.google.com/macros/s/AKfycbyhl4Xg5_5DrSmcGEL3iKV3uLVfwkpduuRUCv9HdBMer4IZJL_LBfk_MQ5eaPvn0BI8/exec";


function formatSheetDateForFilter(dateText) {
  if (!dateText) return "";

  const text = String(dateText).trim();
  const parts = text.split("/");

  if (parts.length !== 3) return "";

  const day = String(parts[0]).padStart(2, "0");
  const month = String(parts[1]).padStart(2, "0");

  let year = Number(parts[2]);

  // แปลงปี พ.ศ. เป็น ค.ศ.
  if (year > 2400) {
    year -= 543;
  }

  return `${year}-${month}-${day}`;
}

const DEPARTMENT_MENUS = [
  {
    permission: "director",
    name: "ผอ.กผง",
    icon: "👤",
  },
  {
    permission: "fbt",
    name: "ฝบท.",
  },
  {
    permission: "kyng",
    name: "กยง.",
  },
  {
    permission: "kph",
    name: "กพข.",
  },
  {
    permission: "kwr",
    name: "กวร.",
  },
  {
    permission: "ktp",
    name: "กตป.",
  },
  {
    permission: "kws",
    name: "กวส.",
  },
];





function Home({user, onLogout}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [department, setDepartment] = useState("ทั้งหมด");
    const tableRef = useRef(null);
    const [menu, setMenu] = useState("dashboard");
    const [selectedPage, setSelectedPage] = useState("dashboard");
    const [searchText, setSearchText] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
    const [selectedDate, setSelectedDate] = useState("");
    const [sheetOptions, setSheetOptions] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState("");
    const [allRows, setAllRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const currentRows =  department === "ทั้งหมด" ? allRows : allRows.filter((row) => row.แผนก?.[department]);
    const [gwsSource, setGwsSource] = useState("sheet");
    const [passengerRows, setPassengerRows] = useState([]);
    const [passengerLoading, setPassengerLoading] = useState(false);
    const [passengerError, setPassengerError] = useState("");

    const [commentRow, setCommentRow] = useState(null);
    const [commentText, setCommentText] = useState("");
    const [savingComment, setSavingComment] = useState(false);

    const [departmentView, setDepartmentView] = useState("work");
    const [openDepartmentMenu, setOpenDepartmentMenu] = useState("");

    const [departmentLinks, setDepartmentLinks] = useState([]);
    const [selectedLink, setSelectedLink] = useState(null);
    
    const [userOptions, setUserOptions] = useState([]);
    const [assigneeModalOpen, setAssigneeModalOpen] = useState(false);

    const [selectedAssignees, setSelectedAssignees] = useState([]);

    const [currentAssigneeRow, setCurrentAssigneeRow] = useState(null);

    const [assigneeSearch, setAssigneeSearch] = useState("");

    
    //date sql filter
    const [passengerStartDate, setPassengerStartDate] = useState("");
    const [passengerEndDate, setPassengerEndDate] = useState("");
    const [selectedAirline, setSelectedAirline] = useState("ทั้งหมด");
    const [selectedAirport, setSelectedAirport] = useState("ทั้งหมด");
    const [passengerView, setPassengerView] = useState("day"); // "chart" หรือ "table"
   
function loadUserOptions() {
  fetch(
    `${API_URLS}?action=listUsers`,
  {
    method: "GET",
    redirect: "follow",
  }
)
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        const activeUsers = (data.users || []).filter(
  (item) =>
    item.active === true ||
    item.active === "TRUE" ||
    item.active === "true"
);

setUserOptions(activeUsers);
console.log("users:", activeUsers);

        setUserOptions(activeUsers);
      }
    })
    .catch((error) => {
      console.error(
        "Load users error:",
        error
      );
    });
}

function openLinkDashboard(link) {
  setSelectedLink(link);
  setMenu("dashboard");
}

function toggleDepartmentMenu(name) {
  setOpenDepartmentMenu((current) =>
    current === name ? "" : name
  );
}

function selectDepartmentView(name, view) {
  setDepartment(name);
  setDepartmentView(view);
  setSelectedPage("dashboard");
  setMenu("dashboard");
  setMenuOpen(false);
  setSelectedLink(null);
}

function hasPermission(permission) {
  if (user?.role === "admin") {
    return true;
  }

  if (!Array.isArray(user?.permissions)) {
    return false;
  }

  return user.permissions.includes(permission);
}


// รายชื่อสายการบินสำหรับ Dropdown
const airlineOptions = useMemo(() => {return [
  "ทั้งหมด",
  ...Array.from(
    new Set(
      passengerRows
        .map((row) => row.airline)
        .filter(Boolean)
    )
  ).sort(),
];
}, [passengerRows]);

// รายชื่อท่าอากาศยานสำหรับ Dropdown
const airportOptions = useMemo(() => {return [
  "ทั้งหมด",
  ...Array.from(
    new Set(
      passengerRows
        .map((row) => row.airport)
        .filter(Boolean)
    )
  ).sort(),
];
}, [passengerRows]);

// กรองข้อมูล SQL
  const filteredPassengerRows = useMemo(() => {
  return passengerRows.filter((row) => {
    const rowDate = String(row.TrnDate || "").slice(0, 10);

    const matchesStartDate =
      !passengerStartDate ||
      rowDate >= passengerStartDate;

    const matchesEndDate =
      !passengerEndDate ||
      rowDate <= passengerEndDate;

    const matchesAirline =
      selectedAirline === "ทั้งหมด" ||
      row.airline === selectedAirline;

    const matchesAirport =
      selectedAirport === "ทั้งหมด" ||
      row.airport === selectedAirport;

    return (
      matchesStartDate &&
      matchesEndDate &&
      matchesAirline &&
      matchesAirport
    );
  });
}, [
  passengerRows,
  passengerStartDate,
  passengerEndDate,
  selectedAirline,
  selectedAirport,
]);

  const groupedPassengerData = useMemo(() => {
  const day = {};
  const month = {};
  const year = {};

  filteredPassengerRows.forEach((row) => {
    const rawDate = row.TrnDate || row.trn_date || "";
    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const value = Number(
      row.totalPassenger ??
        row.total_passenger ??
        0
    );

    // DAY
    const dayKey = date.toISOString().slice(0, 10);

    if (!day[dayKey]) {
      day[dayKey] = {
        key: dayKey,
        label: date.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "numeric",
          year: "numeric",
        }),
        totalPassenger: 0,
      };
    }

    day[dayKey].totalPassenger += value;

    // MONTH
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!month[monthKey]) {
      month[monthKey] = {
        key: monthKey,
        label: date.toLocaleDateString("th-TH", {
          month: "short",
          year: "numeric",
        }),
        totalPassenger: 0,
      };
    }

    month[monthKey].totalPassenger += value;

    // YEAR
    const yearKey = String(date.getFullYear());

    if (!year[yearKey]) {
      year[yearKey] = {
        key: yearKey,
        label: date.toLocaleDateString("th-TH", {
          year: "numeric",
        }),
        totalPassenger: 0,
      };
    }

    year[yearKey].totalPassenger += value;
  });

  return {
    day: Object.values(day).sort((a, b) =>
      a.key.localeCompare(b.key)
    ),

    month: Object.values(month).sort((a, b) =>
      a.key.localeCompare(b.key)
    ),

    year: Object.values(year).sort((a, b) =>
      a.key.localeCompare(b.key)
    ),
  };
}, [filteredPassengerRows]);

   const groupedPassengerRows = 
   groupedPassengerData[passengerView] || [];

   const chartPassengerRows = useMemo(() => {
  if (passengerView === "day") {
    return groupedPassengerRows.slice(-30);
  }

  if (passengerView === "month") {
    return groupedPassengerRows.slice(-12);
  }

  if (passengerView === "year") {
    return groupedPassengerRows;
  }

  return [];
}, [groupedPassengerRows, passengerView]);

  const tablePassengerRows = useMemo(() => {
  if (passengerView === "day") {
    return groupedPassengerRows.slice(-100).reverse();
  }

  if (passengerView === "month") {
    return groupedPassengerRows.slice(-36).reverse();
  }

  return [...groupedPassengerRows].reverse();
}, [groupedPassengerRows, passengerView]);


    const dateFilteredRows = selectedDate
  ? currentRows.filter(
      (row) =>
        formatSheetDateForFilter(row["วันที่รับ"]) === selectedDate
    )
  : currentRows;
    const filteredRows = dateFilteredRows.filter((row) => {
  const keyword = searchText.trim().toLowerCase();


  const matchesSearch =
    !keyword ||
    String(row.เลขรับ || "").toLowerCase().includes(keyword) ||
    String(row.เจ้าของเรื่อง || "").toLowerCase().includes(keyword) ||
    String(row.เรื่อง || "").toLowerCase().includes(keyword) ||
    String(row.สถานะ || "").toLowerCase().includes(keyword) ||
    String(row.หมายเหตุ || "").toLowerCase().includes(keyword);

  const matchesStatus =
    statusFilter === "ทั้งหมด" ||
    (statusFilter === "เกินกำหนด" ? isOverdue(row) : row.สถานะ === statusFilter);
    

  return matchesSearch && matchesStatus;
});

function loadSheetOptions() {
  fetch(`${API_URLS}?action=listSheets`)
    .then((res) => res.json())
    .then((data) => {
      const sheets = data.sheets || [];

      setSheetOptions(sheets);

      if (sheets.length > 0) {
        setSelectedSheet((current) => current || sheets[0]);
      }
    })
    .catch((error) => {
      console.error("Load sheet options error:", error);
    });
}

function loadDepartmentLinks() {
  fetch(`${API_URLS}?action=listLinks`)
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        setDepartmentLinks(data.links);
      }
    })
    .catch((error) => {
      console.error("Load links error:", error);
    });
}
   
function isOverdue(row) {
  if (!row["วันที่กำหนดส่ง"]) {
    return false;
  }

  if (
    row.สถานะ === "เสร็จสิ้น" ||
    row.สถานะ === "ยกเลิก"
  ) {
    return false;
  }

  const parts = String(row["วันที่กำหนดส่ง"]).split("/");

  if (parts.length !== 3) {
    return false;
  }

  let year = Number(parts[2]);

  if (year > 2400) {
    year -= 543;
  }

  const dueDate = new Date(
    year,
    Number(parts[1]) - 1,
    Number(parts[0])
  );

  const today = new Date();

  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}
  
    const currentData = {
  งานทั้งหมด: dateFilteredRows.length,

  กำลังดำเนินการ: dateFilteredRows.filter(
    (row) => row.สถานะ === "กำลังดำเนินการ" && !isOverdue(row)
  ).length,

  เสร็จสิ้น: dateFilteredRows.filter(
    (row) => row.สถานะ === "เสร็จสิ้น" 
  ).length,

  ยกเลิก: dateFilteredRows.filter(
    (row) => row.สถานะ === "ยกเลิก"
  ).length,

  เกินกำหนด: dateFilteredRows.filter(isOverdue).length,  
};
    const pieData = [
  { name: "กำลังดำเนินการ", value: currentData.กำลังดำเนินการ },
  { name: "เสร็จสิ้น", value: currentData.เสร็จสิ้น },
  { name: "ยกเลิก", value: currentData.ยกเลิก },
  { name: "เกินกำหนด", value: currentData.เกินกำหนด },
];
    const barData = [
{ name: "กำลังดำเนินการ", value: currentData.กำลังดำเนินการ },
{ name: "เสร็จสิ้น", value: currentData.เสร็จสิ้น },
{ name: "ยกเลิก", value: currentData.ยกเลิก },
{ name: "เกินกำหนด", value: currentData.เกินกำหนด },
];

const pieColors = [
  "#0f24e6",
  "#16a34a",
  "#dc2626",
  "#ea580c",
];
    
    
function chooseDepartment(name) {
  const permissionMap = {
    "ผอ.กผง": "director",
    "ฝบท.": "fbt",
    "กยง.": "kyng",
    "กพข.": "kph",
    "กวร.": "kwr",
    "กตป.": "ktp",
    "กวส.": "kws",
  };

  const requiredPermission =
    permissionMap[name];

  // ตรวจสอบสิทธิ์ก่อนเข้า Department
  if (
    requiredPermission &&
    !hasPermission(requiredPermission)
  ) {
    return;
  }

  setDepartment(name);
  setSelectedPage("dashboard");
  setMenu("dashboard");
  setMenuOpen(false);
}


    function exportExcel() {
  if (filteredRows.length === 0) {
    alert("ไม่มีข้อมูลสำหรับ Export");
    return;
  }

  const exportData = filteredRows.map((row) => ({
    เลขรับ: row.เลขรับ || "",
    เรื่อง: row.เรื่อง || "",
    เจ้าของเรื่อง: row.เจ้าของเรื่อง || "",
    สถานะ: row.สถานะ || "",
    วันที่กำหนดส่ง: row["วันที่กำหนดส่ง"] || "",
    หมายเหตุ: row.หมายเหตุ || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 60 },
    { wch: 20 },
    { wch: 18 },
    { wch: 60 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    department
  );

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const file = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileName = `ตารางงาน_${department}.xlsx`;

  saveAs(file, fileName);
}
  
  function filterFromCard(status) {
  setStatusFilter(status);

  setTimeout(() => {
    tableRef.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "start",
    });
  }, 100);
}                  
    
   function loadData() {
  if (!selectedSheet) {
    return;
  }

  setLoading(true);

  const url = `${API_URLS}?sheet=${encodeURIComponent(selectedSheet)}`;

  fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error("โหลดข้อมูลไม่สำเร็จ");
      }

      return res.json();
    })
    .then((data) => {
      setAllRows(data.rows || []);
    })
    .catch((error) => {
      console.error("Load data error:", error);
    })
    .finally(() => {
      setLoading(false);
    });
}


function getCommentCount(comment) {
  if (!comment) {
    return 0;
  }

  const matches = String(comment).match(
    /^\[\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}\s+-.*\]/gm
  );

  return matches ? matches.length : 0;
}


function openAssigneeModal(row) {
  const current = row.ชื่อผู้ปฏิบัติงาน
    ? row.ชื่อผู้ปฏิบัติงาน
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    : [];

  setCurrentAssigneeRow(row);
  setSelectedAssignees(current);
  setAssigneeSearch("");
  setAssigneeModalOpen(true);
}

function toggleAssignee(name) {
  setSelectedAssignees((current) => {
    if (current.includes(name)) {
      return current.filter(
        (item) => item !== name
      );
    }

    return [
      ...current,
      name
    ];
  });
}


function saveMultipleAssignee() {
  const names = selectedAssignees.join(", ");

  updateAssignee(
    currentAssigneeRow,
    names
  );

  setAssigneeModalOpen(false);
}






async function updateAssignee(row, assignee) {
  try {
    const response = await fetch(API_URLS, {
      method: "POST",
      body: JSON.stringify({
        action: "updateAssignee",
        sheet: selectedSheet,
        receiveNumber: row.เลขรับ,
        assignee: assignee,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      alert(
        result.message ||
          "บันทึกผู้ปฏิบัติงานไม่สำเร็จ"
      );

      return;
    }

    setAllRows((currentRows) =>
      currentRows.map((item) =>
        item.เลขรับ === row.เลขรับ
          ? {
              ...item,
              ชื่อผู้ปฏิบัติงาน: assignee,
            }
          : item
      )
    );
  } catch (error) {
    console.error(
      "Update assignee error:",
      error
    );

    alert("บันทึกผู้ปฏิบัติงานไม่สำเร็จ");
  }
}



//comment//
async function saveComment() {
  if (!commentRow) {
    return;
  }

  if (!commentText.trim()) {
    alert("กรุณากรอก Comment");
    return;
  }

  try {
    setSavingComment(true);

    const response = await fetch(API_URLS, {
      method: "POST",
      body: JSON.stringify({
        action: "updateComment",
        sheet: selectedSheet,
        receiveNumber: commentRow.เลขรับ,
        comment: commentText.trim(),
        username: user?.username || "",
        name: user?.name || "",
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(
        result.message || "บันทึก Comment ไม่สำเร็จ"
      );
    }

    setCommentRow(null);
    setCommentText("");

    await loadData();
  } catch (error) {
    console.error("Save comment error:", error);

    alert(
      error.message || "บันทึก Comment ไม่สำเร็จ"
    );
  } finally {
    setSavingComment(false);
  }
}

  function getDepartmentLinks(permission) {
  return departmentLinks.filter((link) => {
    return (
      link.permission.includes("all") ||
      link.permission.includes(permission)
    );
  });
}

  // Load passenger data from SQL Server
   async function loadPassengerData() {
  try {
    setPassengerLoading(true);
    setPassengerError("");

    const response = await fetch(
      "http://localhost:3001/api/passengers"
    );

    if (!response.ok) {
      throw new Error("โหลดข้อมูลผู้โดยสารไม่สำเร็จ");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.message || "โหลดข้อมูลผู้โดยสารไม่สำเร็จ"
      );
    }

    setPassengerRows(data.rows || []);
  } catch (error) {
    console.error("Passenger load error:", error);

    setPassengerError(error.message);
  } finally {
    setPassengerLoading(false);
  }
}
   useEffect(() => {
  if (
    department === "กวส." &&
    gwsSource === "sql"
  ) {
    loadPassengerData();
  }
}, [department, gwsSource]);

useEffect(() => {
  loadUserOptions();
}, []);

useEffect(() => {
  if (!user) {
    return;
  }

  // Admin สามารถเข้าถึงทุก Department
  if (user.role === "admin") {
    return;
  }

  const permissions = Array.isArray(user.permissions)
    ? user.permissions
    : [];

  // ถ้ามีสิทธิ์หน้าหลัก ให้เริ่มที่ "ทั้งหมด"
  if (permissions.includes("home")) {
    setDepartment("ทั้งหมด");
    return;
  }

  // หา Department แรกที่ผู้ใช้มีสิทธิ์เข้าถึง
  const firstAllowedDepartment = [
    ["director", "ผอ.กผง"],
    ["fbt", "ฝบท."],
    ["kyng", "กยง."],
    ["kph", "กพข."],
    ["kwr", "กวร."],
    ["ktp", "กตป."],
    ["kws", "กวส."],
  ].find(([permission]) =>
    permissions.includes(permission)
  );

  if (firstAllowedDepartment) {
    setDepartment(firstAllowedDepartment[1]);
  }
}, [user]);


    useEffect(() => {
      loadDepartmentLinks();
    }, []);

    useEffect(() => {
      loadSheetOptions();
    }, []);
    
    useEffect(() => {
      if (selectedSheet) {
      loadData();
      }
    }, [selectedSheet]);

    useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 60000);

  return () => clearInterval(timer);
}, []);
  
    return (
    <div className="app">
      <button
  className={`mobile-menu-button ${menuOpen ? "open" : ""}`}
  onClick={() => setMenuOpen((current) => !current)}
  aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
>
  <span className="mobile-menu-icon">
    {menuOpen ? "✕" : "☰"}
  </span>

  <span className="mobile-menu-text">
    {menuOpen ? "ปิด" : "เมนู"}
  </span>
</button>
      {/* Sidebar */}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="logoBox">
          <img
            src="/doa-logo.png"
            alt="DOA"
            className="logoImage"
          />

          <h2>กองแผนงาน</h2>
          <p>Department of Airports</p>
        </div>

        
       
  
{hasPermission("home") && (
  <button
    className={
      menu === "dashboard" &&
      department === "ทั้งหมด"
        ? "menu active"
        : "menu"
    }
    onClick={() => {
      setSelectedLink(null);
      setDepartment("ทั้งหมด");
      setDepartmentView("work");
      setSelectedPage("dashboard");
      setMenu("dashboard");
      setOpenDepartmentMenu("");
      setMenuOpen(false);
    }}
  >
    🏠 หน้าหลัก
  </button>
)}


  {DEPARTMENT_MENUS.map((item) => {
  if (!hasPermission(item.permission)) {
    return null;
  }

  const isOpen = openDepartmentMenu === item.name;

  return (
    <div
      className="departmentMenuGroup"
      key={item.name}
    >
      <button
        className={
          menu === "dashboard" &&
          department === item.name
            ? "menu active"
            : "menu"
        }
        onClick={() =>
          toggleDepartmentMenu(item.name)
        }
      >
        <span>
          {item.icon || ""} {item.name}
        </span>

        <span className="menuArrow">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
  <div className="departmentSubmenu">
    <button
      className={
        department === item.name &&
        departmentView === "work"
          ? "submenuButton active"
          : "submenuButton"
      }
      onClick={() =>
        selectDepartmentView(
          item.name,
          "work"
        )
      }
    >
      ติดตามงาน
    </button>

    

    {getDepartmentLinks(item.permission).map(
      (link) => (
        
<button
  className={
    selectedLink?.id === link.id
      ? "submenuButton active"
      : "submenuButton"
  }
  onClick={() => {
    setSelectedLink(link);
    setDepartmentView("link");
    setMenuOpen(false);
  }}
>
  {link.name}
</button>


      )
    )}
  </div>
)}
    </div>
  );
})}


        {user?.role === "admin" && (
  <button
    className={
      menu === "users"
        ? "menu active"
        : "menu"
    }
    onClick={() => {
      setMenu("users");
      setOpenDepartmentMenu("");
      setMenuOpen(false);
    }}
  >
    👥 จัดการผู้ใช้
  </button>
)}

{user?.role === "admin" && (
  <button
    className={
      menu === "links"
        ? "menu active"
        : "menu"
    }
    onClick={() => {
      setMenu("links");
      setOpenDepartmentMenu("");
      setMenuOpen(false);
    }}
  >
    🔗 จัดการ Link
  </button>
)}

<button
    className="menu logout-menu"
    onClick={onLogout}
  >
    🔒 ออกจากระบบ
  </button> 

      </aside>

      

      {/* Main Content */}
      <main className={"content "}>

       
{menu === "users" && user?.role === "admin" ? (
  <UserManagement />
) : menu === "links" && user?.role === "admin" ? (
  <LinkManagement />
) : (
  <>


{selectedLink ? (

<div className="budgetDashboardContainer">



<iframe
src={selectedLink.url}
title="dashboard"
className="budgetDashboardFrame"
/>

</div>


)  : (

<>
  
  
     {department === "กวส." && (
  <div className="gwsSourceSelector">
    <label>แหล่งข้อมูล</label>

    <select
      value={gwsSource}
      onChange={(event) => setGwsSource(event.target.value)}
    >
      <option value="sheet">
        ข้อมูลงาน Google Sheet
      </option>

      <option value="sql">
        ข้อมูลผู้โดยสาร 
      </option>
    </select>
  </div>
)}

{department === "กวส." && gwsSource === "sql" ? (
 <div className="sqlPassengerPage">
  <h1>ข้อมูลผู้โดยสาร</h1>

  <div className="passengerFilterCard">
  <div className="filterGroup">
    <label>วันที่เริ่มต้น</label>
    <input
      type="date"
      value={passengerStartDate}
      onChange={(event) =>
        setPassengerStartDate(event.target.value)
      }
    />
  </div>

  <div className="filterGroup">
    <label>วันที่สิ้นสุด</label>
    <input
      type="date"
      value={passengerEndDate}
      onChange={(event) =>
        setPassengerEndDate(event.target.value)
      }
    />
  </div>

  <div className="filterGroup">
    <label>สายการบิน</label>
    <select
      value={selectedAirline}
      onChange={(event) =>
        setSelectedAirline(event.target.value)
      }
    >
      {airlineOptions.map((airline) => (
        <option key={airline} value={airline}>
          {airline}
        </option>
      ))}
    </select>
  </div>

  <div className="filterGroup">
    <label>ท่าอากาศยาน</label>
    <select
      value={selectedAirport}
      onChange={(event) =>
        setSelectedAirport(event.target.value)
      }
    >
      {airportOptions.map((airport) => (
        <option key={airport} value={airport}>
          {airport}
        </option>
      ))}
    </select>
  </div>

  <button
    type="button"
    className="clearPassengerFilter"
    onClick={() => {
      setPassengerStartDate("");
      setPassengerEndDate("");
      setSelectedAirline("ทั้งหมด");
      setSelectedAirport("ทั้งหมด");
    }}
  >
    ล้างตัวกรอง
  </button>
</div>

  <button
    type="button"
    onClick={loadPassengerData}
    disabled={passengerLoading}
  >
    {passengerLoading
      ? "กำลังโหลด..."
      : "รีเฟรชข้อมูล"}
  </button>

  {passengerError && (
    <p>{passengerError}</p>
  )}
  

  {!passengerLoading &&
  !passengerError &&
  groupedPassengerRows.length > 0 && (
    <div className="passengerChartLayout">
  <div className="passengerViewButtons">
    <button
      className={passengerView === "day" ? "active" : ""}
      onClick={() => setPassengerView("day")}
    >
      วัน
    </button>

    <button
      className={passengerView === "month" ? "active" : ""}
      onClick={() => setPassengerView("month")}
    >
      เดือน
    </button>

    <button
      className={passengerView === "year" ? "active" : ""}
      onClick={() => setPassengerView("year")}
    >
      ปี
    </button>
  </div>

  <div className="chartBox passengerMainChart">
    <h2>จำนวนผู้โดยสาร</h2>

    <ResponsiveContainer width="100%" height={400}>
  <BarChart data={chartPassengerRows}>
    <CartesianGrid strokeDasharray="3 3" />

    <XAxis
      dataKey="label"
      interval="preserveStartEnd"
      angle={-35}
      textAnchor="end"
      height={80}
    />

    <YAxis
      tickFormatter={(value) =>
        Number(value).toLocaleString()
      }
    />

    <Tooltip
      formatter={(value) => [
        Number(value).toLocaleString(),
        "จำนวนผู้โดยสาร",
      ]}
    />

    <Bar
      dataKey="totalPassenger"
      name="จำนวนผู้โดยสาร"
      fill="#3b82f6"
      radius={[6, 6, 0, 0]}
      isAnimationActive={false}
    />
  </BarChart>
</ResponsiveContainer>

  </div>
    </div>
  )}

  {!passengerLoading &&
    !passengerError &&
    filteredPassengerRows.length > 0 && (
      <div className="passengerTableWrapper">
        <table className="passengerTable">
          <thead>
            <tr>
              <th>วันที่</th>
              <th>จำนวนผู้โดยสาร</th>
            </tr>
          </thead>

          <tbody>
            {[...tablePassengerRows].map((row) => (
              <tr key={row.key}>
                <td>
                  {row.label}
                </td>

                <td>
                  {Number(
                    row.totalPassenger || 0
                  ).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    {!passengerLoading &&
  !passengerError &&
  groupedPassengerRows.length === 0 && (
    <p className="emptyChart">
      ไม่มีข้อมูลผู้โดยสารในช่วงวันที่เลือก
    </p>
  )}
</div>
) : (
  <>

        <div className="dateFilter">
  <label htmlFor="receiveDate">📅เลือกวันที่</label>

  <input
    id="receiveDate"
    type="date"
    value={selectedDate}
    onChange={(event) => {
      setSelectedDate(event.target.value);
      setStatusFilter("ทั้งหมด");
    }}
  />

  {selectedDate && (
    <button
      type="button"
      onClick={() => setSelectedDate("")}
    >
      ล้าง
    </button>
  )}
</div>

<div className="topbar">
  <div className="pageTitleBox">
    <h1>
      {department === "ทั้งหมด" ? "ภาพรวมกองแผนงาน" : department}
    </h1>
  </div>

  <div className="sheetSelector">
    <label>ชุดข้อมูล</label>

    <select
      value={selectedSheet}
      onChange={(event) => setSelectedSheet(event.target.value)}
    >
      {sheetOptions.map((sheetName) => (
        <option
          key={sheetName}
          value={sheetName}
        >
          {sheetName}
        </option>
      ))}
    </select>
  </div>

  <div className="date">
    <div>
      {currentTime.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
    </div>

    <div>
      {currentTime.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </div>
  </div>
</div>

        {/* Cards */}
<div className="cards">
  <div
    className="card total"
    onClick={() => filterFromCard("ทั้งหมด")}
    style={{ cursor: "pointer" }}
    >
    <h3>งานทั้งหมด</h3>
    <h1>{currentData.งานทั้งหมด}</h1>
  </div>

  <div
    className="card progress"
    onClick={() => filterFromCard("กำลังดำเนินการ")}
    style={{ cursor: "pointer" }}>
    <h3>กำลังดำเนินการ</h3>
    <h1>{currentData.กำลังดำเนินการ}</h1>
  </div>

  <div
    className="card complete"
    onClick={() => filterFromCard("เสร็จสิ้น")}
    style={{ cursor: "pointer" }}>
    <h3>เสร็จสิ้น</h3>
    <h1>{currentData.เสร็จสิ้น}</h1>
  </div>

  <div
    className="card cancel"
    onClick={() => filterFromCard("ยกเลิก")}
    style={{ cursor: "pointer" }}>
    <h3>ยกเลิก</h3>
    <h1>{currentData.ยกเลิก}</h1>
  </div>

  <div
    className="card late"
    onClick={() => filterFromCard("เกินกำหนด")}
    style={{ cursor: "pointer" }}
  >
    <h3>เกินกำหนด</h3>
    <h1>{currentData.เกินกำหนด}</h1>
  </div>

         </div>

    <div className="chartArea">
      <div className="chartBox">
  <h2>สัดส่วนสถานะงาน</h2>

  {currentData.งานทั้งหมด > 0 ? (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, value }) => `${name} ${value}`}
        >
          {pieData.map((item, index) => (
            <Cell
              key={item.name}
              fill={pieColors[index]}
            />
          ))}
        </Pie>

        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  ) : (
    <p className="emptyChart">ยังไม่มีข้อมูล</p>
  )}
</div>

      <div className="chartBox">
  <h2>จำนวนงานแต่ละสถานะ</h2>

  <ResponsiveContainer width="100%" height={340}>
    <BarChart data={barData}>
      <CartesianGrid strokeDasharray="3 3" />

      <XAxis
   dataKey="name"
   interval={0}
   angle={-20}
   textAnchor="end"
   height={80}
   tickMargin={10}
   tick={{ fontSize: 12 }}
   tickFormatter={(value) =>
    value === "กำลังดำเนินการ"
      ? "กำลังดำเนินฯ"
      : value
   }
/>

      <YAxis />

      <Tooltip />

      <Bar
        dataKey="value"
        fill="#3b82f6"
        radius={[6, 6, 0, 0]}
      />
    </BarChart>
  </ResponsiveContainer>
</div>
    </div>

   <div className="tableBox" ref={tableRef}>
  <h2>{department === "ทั้งหมด" ? "ตารางงานทั้งหมด" : `ตารางงานของ ${department}`}</h2>
  <div className="tableTools">
  <input
    type="text"
    placeholder="ค้นหาเลขรับ เรื่อง สถานะ หรือหมายเหตุ"
    value={searchText}
    onChange={(event) => setSearchText(event.target.value)}
  />
    <select
  value={statusFilter}
  onChange={(event) => setStatusFilter(event.target.value)}
>
  <option value="ทั้งหมด">ทุกสถานะ</option>
  <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
  <option value="เสร็จสิ้น">เสร็จสิ้น</option>
  <option value="ยกเลิก">ยกเลิก</option>
  <option value="ว่าง">ว่าง</option>
  <option value="เกินกำหนด">เกินกำหนด</option>
</select>
  <button
  className='exportButton'
  onClick={exportExcel}
  >
  Export Excel
  </button>
  
  <button
  className="refreshBtn"
  onClick={loadData}
  disabled={loading}
>
  {loading ? "กำลังโหลด..." : "รีเฟรชข้อมูล"}
</button>

  {searchText && (
    <button onClick={() => setSearchText("")}>
      clear
    </button>
  )}
</div>
  <div className="tableWrapper">
    <table className="workTable">
      <thead>
        <tr>
          <th>เลขรับ</th>
          <th>เจ้าของเรื่อง</th>
          <th>ชื่อผู้ปฏิบัติงาน</th>
          <th>เรื่อง</th>
          <th className="statusColumn">สถานะ</th>
          <th className="dueDateColumn">วันที่กำหนดส่ง</th>
          <th>หมายเหตุ</th>
          <th className="attachmentColumn">เอกสารแนบ</th>
        </tr>
      </thead>

      <tbody>
        {filteredRows.length > 0 ? (
          filteredRows.map((row, index) => (
            <tr
  key={index}
  className={
    isOverdue(row)
      ? "row-late"
      : row.สถานะ === "กำลังดำเนินการ"
      ? "row-progress"
      : row.สถานะ === "เสร็จสิ้น"
      ? "row-complete"
      : row.สถานะ === "ยกเลิก"
      ? "row-cancel"
      : ""
  }
>
              <td>{row.เลขรับ}</td>
              <td>{row.เจ้าของเรื่อง || "-"}</td>
              <td>
  <button
    className="assigneePickerButton"
    onClick={() => openAssigneeModal(row)}
  >
    {row.ชื่อผู้ปฏิบัติงาน
      ? row.ชื่อผู้ปฏิบัติงาน
      : "เลือกผู้ปฏิบัติงาน"}
  </button>
</td>
              <td>{row.เรื่อง}</td>
             
    <td className="statusColumn">
  <div className="statusWithComment">
    <span
      className={`status-badge ${
        isOverdue(row)
          ? "status-late"
          : row.สถานะ === "กำลังดำเนินการ"
            ? "status-progress"
            : row.สถานะ === "เสร็จสิ้น"
              ? "status-complete"
              : row.สถานะ === "ยกเลิก"
                ? "status-cancel"
                : ""
      }`}
    >
      {isOverdue(row) ? "เกินกำหนด" : row.สถานะ}
    </span>

    {(row.สถานะ === "กำลังดำเนินการ" ||
      row.สถานะ === "ยกเลิก") && (
      <>
        <span
          className={
            getCommentCount(row.Comment) > 0
              ? "commentCountBadge hasComment"
              : "commentCountBadge"
          }
        >
          💬 {getCommentCount(row.Comment)}
        </span>

        <button
          type="button"
          className="commentMenuButton"
          onClick={() => {
            setCommentRow(row);
            setCommentText("");
          }}
          title="ดูหรือเพิ่ม Comment"
        >
          ⋮
        </button>
      </>
    )}
  </div>
</td>
              <td className="dueDateColumn">
                {row.วันที่กำหนดส่ง}
              </td>
              <td>{row.หมายเหตุ}</td>
             <td className="attachment-cell attachmentColumn">
  {row.เอกสารแนบ ? (
  <a
    href={row.เอกสารแนบ}
    target="_blank"
    rel="noopener noreferrer"
  >
    <img
      src={row.เอกสารแนบ}
      width="80"
      alt="เอกสารแนบ"
    />
  </a>
) : (
  "-"
)}
</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="8" className="emptyRow">
              ยังไม่มีข้อมูลของแผนกนี้
            </td>
          </tr>
        )}
           </tbody>
         </table>
       </div>
     </div>
    </>
    )}
    </>
    )}

  {assigneeModalOpen && (
  <div
    className="assigneeModalOverlay"
    onClick={() => setAssigneeModalOpen(false)}
  >
    <div
      className="assigneeModal"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ===== Modal Header ===== */}

      <div className="assigneeModalHeader">
        <div>
          <h3>เลือกผู้ปฏิบัติงาน</h3>

          <p className="assigneeModalSubtext">
            เลือกได้หลายคน
          </p>
        </div>

        <button
          type="button"
          className="assigneeCloseButton"
          onClick={() => setAssigneeModalOpen(false)}
        >
          ×
        </button>
      </div>

      {/* ===== Search ===== */}

      <div className="assigneeModalSearchWrap">
        <input
          className="assigneeModalSearch"
          placeholder="ค้นหาชื่อ"
          value={assigneeSearch}
          onChange={(e) => setAssigneeSearch(e.target.value)}
        />
      </div>

      {/* ===== Selected Count ===== */}

      <div className="assigneeSelectedCount">
        เลือกแล้ว {selectedAssignees.length} คน
      </div>

      {/* ===== Assignee List ===== */}

      <div className="assigneeModalList">

        {/* ยังไม่ได้มอบหมาย */}

        <label className="assigneeOptionRow clearOption">
          <input
            type="checkbox"
            checked={selectedAssignees.length === 0}
            onChange={() => setSelectedAssignees([])}
          />

          <span>ยังไม่ได้มอบหมาย</span>
        </label>

        {/* รายชื่อผู้ปฏิบัติงาน */}

        {userOptions
          .filter((user) =>
            String(user.name || "")
              .toLowerCase()
              .includes(assigneeSearch.toLowerCase())
          )
          .map((user) => (
            <label
              key={user.username}
              className={
                selectedAssignees.includes(user.name)
                  ? "assigneeOptionRow selected"
                  : "assigneeOptionRow"
              }
            >
              <input
                type="checkbox"
                checked={selectedAssignees.includes(user.name)}
                onChange={() => toggleAssignee(user.name)}
              />

              <div className="assigneeOptionText">
                <span className="assigneeOptionName">
                  {user.name}
                </span>

                <span className="assigneeOptionUsername">
                  {user.username}
                </span>
              </div>
            </label>
          ))}

      </div>

      {/* ===== Modal Footer ===== */}

      <div className="assigneeModalFooter">
        <button
          type="button"
          className="assigneeCancelButton"
          onClick={() => setAssigneeModalOpen(false)}
        >
          ยกเลิก
        </button>

        <button
          type="button"
          className="assigneeSaveButton"
          onClick={saveMultipleAssignee}
        >
          บันทึก
        </button>
      </div>

    </div>
  </div>
)}

    {commentRow && (
  <div
    className="commentModalOverlay"
    onClick={() => {
      if (!savingComment) {
        setCommentRow(null);
        setCommentText("");
      }
    }}
  >
    <div
      className="commentModal"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="commentModalHeader">
        <h3>เพิ่ม Comment</h3>

        <button
          type="button"
          onClick={() => {
            setCommentRow(null);
            setCommentText("");
          }}
          disabled={savingComment}
        >
          ×
        </button>
      </div>

      <p>
        เลขรับ: {commentRow.เลขรับ}
      </p>

      <p>
        สถานะ: {commentRow.สถานะ}
      </p>

      {commentRow.Comment && (
  <div className="oldComments">
    <label>Comment ก่อนหน้า</label>

    <div className="oldCommentsBox">
      {commentRow.Comment}
    </div>
  </div>
)}

      <textarea
        value={commentText}
        onChange={(event) =>
          setCommentText(event.target.value)
        }
        placeholder="เขียน Comment..."
        rows={5}
        autoFocus
      />
    
   
    
      <div className="commentModalButtons">
        <button
          type="button"
          onClick={() => {
            setCommentRow(null);
            setCommentText("");
          }}
          disabled={savingComment}
        >
          ยกเลิก
        </button>

        <button
          type="button"
          onClick={saveComment}
          disabled={
            savingComment ||
            !commentText.trim()
          }
        >
          {savingComment
            ? "กำลังบันทึก..."
            : "บันทึก Comment"}
        </button>
      </div>
    </div>
  </div>
)}
  </>
)}

        
</main>
</div>
);
}

export default Home;
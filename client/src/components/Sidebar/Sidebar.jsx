import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/editor", label: "Editor" },
  { to: "/snippets", label: "Snippets" },
  { to: "/history", label: "History" },
  { to: "/profile", label: "Profile" },
];

function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          {link.label}
        </NavLink>
      ))}
    </aside>
  );
}

export default Sidebar;

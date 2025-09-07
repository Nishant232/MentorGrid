import { NavLink, Outlet } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted"
  }`;

const AdminLayout = () => {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between py-4">
          <h1 className="text-xl font-semibold">Admin</h1>
          <nav className="flex items-center gap-2">
            <NavLink to="/admin/analytics" className={navLinkClass} end>
              Analytics
            </NavLink>
            <NavLink to="/admin/users" className={navLinkClass}>
              Users
            </NavLink>
            <NavLink to="/admin/approvals" className={navLinkClass}>
              Approvals
            </NavLink>
            <NavLink to="/admin/payments" className={navLinkClass}>
              Payments
            </NavLink>
            <NavLink to="/admin/reports" className={navLinkClass}>
              Reports
            </NavLink>
            <NavLink to="/admin/review-moderation" className={navLinkClass}>
              Reviews
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="container mx-auto py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;



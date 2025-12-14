import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-[#0C0718] relative overflow-hidden flex flex-col justify-center items-center">
      <Outlet />
    </div>
  );
}

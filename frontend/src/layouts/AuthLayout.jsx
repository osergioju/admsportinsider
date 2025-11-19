import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="h-screen w-full pt-[100px] pb-[200px] bg-[#0C0718] relative overflow-hidden flex flex-col justify-center items-center">
      <Outlet />
    </div>
  );
}

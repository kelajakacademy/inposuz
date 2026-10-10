import React from "react";
import { useOrder } from "../context/OrderContext";
import { CashierLayout } from "./CashierLayout";
import { WaiterLayout } from "./waiter/WaiterLayout";

export default function Dashboard() {
  const { waiter, logout } = useOrder();

  const role = (waiter?.role || "").toLowerCase();

  // Waiter Role -> WaiterLayout
  const isWaiter = 
    (role.includes("ofitsiant") || role.includes("официант") || role.includes("waiter")) &&
    !role.includes("admin") &&
    !role.includes("kassir") &&
    !role.includes("кассир") &&
    !waiter?.isAdmin;

  if (isWaiter) {
    return <WaiterLayout onLogout={logout} />;
  }

  // Both Cashier and Admin profiles are 100% identical! -> CashierLayout
  return <CashierLayout />;
}

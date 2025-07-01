"use client"
import { DoorLockDashboard } from "@/components/door-lock-dashboard"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function Home() {
  return (
    <SidebarProvider defaultOpen={true}>
      <DoorLockDashboard />
    </SidebarProvider>
  )
}

"use client"

import { motion } from "framer-motion"
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  Info,
  LogOut,
  Smartphone,
  Wifi,
  Bluetooth,
  Moon,
  Sun,
  Volume2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
// import { Switch } from "@/components/ui/switch"
import { useTransitionRouter } from "next-view-transitions"
import { useTheme } from "next-themes"
import { slideInOutBack } from "@/lib/transition"

export default function Settings() {
  const router = useTransitionRouter()
  const { theme, setTheme } = useTheme()

  const goBack = () => {
    router.push("/", {
      onTransitionReady: slideInOutBack,
    })
  }

  const settingsGroups = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          title: "Profile",
          subtitle: "Manage your account details",
          action: () => console.log("Profile"),
        },
        {
          icon: Shield,
          title: "Security",
          subtitle: "Privacy and security settings",
          action: () => console.log("Security"),
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: Bell,
          title: "Notifications",
          subtitle: "Push notifications and alerts",
          hasSwitch: true,
          switchValue: true,
        },
        {
          icon: Volume2,
          title: "Sound & Haptics",
          subtitle: "Audio feedback and vibration",
          hasSwitch: true,
          switchValue: true,
        },
        {
          icon: theme === "dark" ? Moon : Sun,
          title: "Dark Mode",
          subtitle: "Toggle dark/light theme",
          hasSwitch: true,
          switchValue: theme === "dark",
          onToggle: () => setTheme(theme === "dark" ? "light" : "dark"),
        },
      ],
    },
    {
      title: "Device",
      items: [
        {
          icon: Bluetooth,
          title: "Bluetooth",
          subtitle: "Manage Bluetooth connections",
          action: () => console.log("Bluetooth"),
        },
        {
          icon: Wifi,
          title: "Wi-Fi Settings",
          subtitle: "Network configuration",
          action: () => console.log("Wi-Fi"),
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          icon: Smartphone,
          title: "App Version",
          subtitle: "v1.0.0 (Build 123)",
          action: () => console.log("Version"),
        },
        {
          icon: Info,
          title: "Help & Support",
          subtitle: "Get help and contact support",
          action: () => console.log("Help"),
        },
      ],
    },
  ]

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col">
      {/* Status Bar Spacer */}
      <div className="h-6 bg-transparent flex-shrink-0" />

      {/* Fixed Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 flex-shrink-0"
      >
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" size="icon" className="rounded-2xl bg-slate-100 dark:bg-slate-800" onClick={goBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </motion.div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h1>
        </div>
      </motion.header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-white/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">John Doe</h3>
                <p className="text-slate-600 dark:text-slate-400">test@example.com</p>
                <p className="text-xs text-slate-500 mt-1">Premium Member</p>
              </div>
            </div>
          </motion.div>

          {/* Settings Groups */}
          {settingsGroups.map((group, groupIndex) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
              className="space-y-3"
            >
              <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide px-2">{group.title}</h4>

              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                {group.items.map((item, itemIndex) => (
                  <motion.div
                    key={item.title}
                    whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 cursor-pointer transition-colors ${itemIndex !== group.items.length - 1 ? "border-b border-slate-100 dark:border-slate-700" : ""
                      }`}
                  // onClick={item.action}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
                          <item.icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                          <h5 className="font-medium text-slate-900 dark:text-white">{item.title}</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{item.subtitle}</p>
                        </div>
                      </div>

                      {/* {item.hasSwitch ? (
                        <motion.div
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            item.onToggle?.()
                          }}
                        >
                          <Switch checked={item.switchValue} onCheckedChange={item.onToggle} />
                        </motion.div>
                      ) : (
                        <ArrowLeft className="h-4 w-4 text-slate-400 rotate-180" />
                      )} */}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Sign Out */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-red-200 dark:border-red-800 overflow-hidden"
          >
            <motion.div
              whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.05)" }}
              whileTap={{ scale: 0.98 }}
              className="p-4 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-2xl flex items-center justify-center">
                  <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h5 className="font-medium text-red-600 dark:text-red-400">Sign Out</h5>
                  <p className="text-sm text-red-500 dark:text-red-500">Sign out of your account</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

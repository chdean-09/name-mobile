"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Edit2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Keyboard } from "@capacitor/keyboard"

interface EditDeviceModalProps {
  isOpen: boolean
  onClose: () => void
  deviceId: string
  currentName: string
  onSave: (newName: string) => void
}

export function EditDeviceModal({ isOpen, onClose, deviceId, currentName, onSave }: EditDeviceModalProps) {
  const [deviceName, setDeviceName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDeviceName(currentName)
    }
  }, [isOpen, currentName])

  useEffect(() => {
    const setupKeyboardListeners = async () => {
      const showListener = await Keyboard.addListener('keyboardWillShow', () => {
        setKeyboardOpen(true);
      });
      const hideListener = await Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardOpen(false);
      });
      // For Android
      const showListener2 = await Keyboard.addListener('keyboardDidShow', () => {
        setKeyboardOpen(true);
      });
      const hideListener2 = await Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardOpen(false);
      });

      return () => {
        showListener.remove();
        hideListener.remove();
        showListener2.remove();
        hideListener2.remove();
      };
    };

    let cleanup: (() => void) | undefined;
    setupKeyboardListeners().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      cleanup?.();
    };
  }, []);

  const handleSave = async () => {
    if (!deviceName.trim() || deviceName.trim() === currentName) {
      onClose()
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Call the API to update device name
      await fetch(`https://name-server-production.up.railway.app/device-list/${deviceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newName: deviceName.trim() }),
      })

      onSave(deviceName.trim())
      onClose()
    } catch (error) {
      console.error("Failed to update device name:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed inset-x-4 ${keyboardOpen ? 'top-28' : 'top-1/2'} ${keyboardOpen ? '' : '-translate-y-1/2'} bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-50 overflow-hidden max-w-md mx-auto`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-2xl flex items-center justify-center">
                  <Edit2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Device</h2>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="device-name" className="text-sm font-medium">
                  Device Name
                </Label>
                <Input
                  id="device-name"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter device name"
                  className="rounded-2xl"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-2xl bg-transparent"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!deviceName.trim() || deviceName.trim() === currentName || isLoading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-2xl"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

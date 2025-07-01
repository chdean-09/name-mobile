"use client"

import { useState } from "react"
import { Plus, Check } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Device {
  id: string
  name: string
  ipAddress: string
  status: "locked" | "unlocked"
  isOnline: boolean
  lastSeen: string
}

interface User {
  id: string
  email: string
  deviceAccess: string[]
}

interface ManageAccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  devices: Device[]
  users: User[]
  onAddUser: (email: string, deviceAccess: string[]) => void
}

export function ManageAccessDialog({ open, onOpenChange, devices, users, onAddUser }: ManageAccessDialogProps) {
  const [newUserEmail, setNewUserEmail] = useState("")
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const handleDeviceToggle = (deviceId: string) => {
    setSelectedDevices((prev) => (prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]))
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedDevices([])
    } else {
      setSelectedDevices(devices.map((d) => d.id))
    }
    setSelectAll(!selectAll)
  }

  const handleAddUser = () => {
    if (newUserEmail && selectedDevices.length > 0) {
      onAddUser(newUserEmail, selectedDevices)
      setNewUserEmail("")
      setSelectedDevices([])
      setSelectAll(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Device Access</DialogTitle>
          <DialogDescription>Add users and control which devices they can access.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New User */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-email">Email Address</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Device Access</Label>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    <Check className="mr-2 h-4 w-4" />
                    {selectAll ? "Deselect All" : "Select All"}
                  </Button>
                </div>

                <div className="space-y-2">
                  {devices.map((device) => (
                    <div key={device.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox
                        id={`device-${device.id}`}
                        checked={selectedDevices.includes(device.id)}
                        onCheckedChange={() => handleDeviceToggle(device.id)}
                      />
                      <Label htmlFor={`device-${device.id}`} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span>{device.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {device.ipAddress}
                            </Badge>
                            <Badge
                              variant={device.isOnline ? "default" : "secondary"}
                              className={device.isOnline ? "bg-green-500" : ""}
                            >
                              {device.isOnline ? "Online" : "Offline"}
                            </Badge>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleAddUser}
                disabled={!newUserEmail || selectedDevices.length === 0}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </CardContent>
          </Card>

          {/* Existing Users */}
          {users.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.slice(1).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <div className="flex gap-1 mt-1">
                          {user.deviceAccess.map((deviceId) => {
                            const device = devices.find((d) => d.id === deviceId)
                            return device ? (
                              <Badge key={deviceId} variant="outline" className="text-xs">
                                {device.name}
                              </Badge>
                            ) : null
                          })}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

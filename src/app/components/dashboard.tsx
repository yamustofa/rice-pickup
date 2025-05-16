'use client'

import { useState } from 'react'
import { Profile } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, CalendarPlus } from 'lucide-react'
import AddPickupDialog from './add-pickup-dialog'
import { UserDataTable, UserWithStatus } from "./user-data-table"

interface DashboardProps {
  users: UserWithStatus[]
  currentUser: Profile
  monthId: string
}

export default function Dashboard({ users, currentUser, monthId }: DashboardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  
  const handleOpenAddPickup = (user: UserWithStatus) => {
    setSelectedUser({
      id: user.id,
      name: user.name,
      quota: user.quota,
      avatar_config: user.avatar_config,
      created_at: '',
      updated_at: '',
      division_id: null
    })
    setIsDialogOpen(true)
  }
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedUser(null)
  }
  
  const currentUserData = users.find(user => user.id === currentUser.id)
  
  // Calculate overall stats
  const totalUsers = users.length
  const completedUsers = users.filter(user => user.isCompleted).length
  const completionRate = totalUsers > 0 ? Math.round((completedUsers / totalUsers) * 100) : 0
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage your monthly rice pickups
          </p>
        </div>
        {currentUserData && (
          <div className="flex items-center gap-2 mt-2 md:mt-0">
            {!currentUserData.isCompleted ? (
              <Button 
                size="sm" 
                onClick={() => handleOpenAddPickup(currentUserData)}
              >
                <CalendarPlus className="mr-1 h-4 w-4" />
                Record Pickup
              </Button>
            ) : (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="mr-1 h-3 w-3" />
                Completed
              </Badge>
            )}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {currentUserData && (
          <Card className="w-full md:w-auto bg-accent border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Your Rice Quota</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {currentUserData.pickedUp} <span className="text-base font-normal text-muted-foreground">of {currentUserData.quota} sacks</span>
                </p>
                <Progress value={(currentUserData.pickedUp / currentUserData.quota) * 100} className="h-2 w-36" />
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <CardDescription>All registered employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Pickups</CardTitle>
            <CardDescription>Users who picked up their quota</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CardDescription>Overall progress this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">{completionRate}%</div>
              <Progress value={completionRate} className="h-2 w-20" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        <UserDataTable
          data={users}
          onRecordPickup={handleOpenAddPickup}
        />
      </div>
      
      {selectedUser && (
        <AddPickupDialog
          user={selectedUser}
          monthId={monthId}
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  )
} 
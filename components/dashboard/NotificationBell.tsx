"use client"

import { Bell } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function NotificationBell() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-primary/5 transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 shadow-xl border-primary/10">
        <div className="p-4 border-b flex items-center justify-between bg-primary/5">
          <h3 className="font-semibold text-sm">Notifications</h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Bell className="h-6 w-6 text-muted-foreground opacity-20" />
            </div>
            <p className="text-sm text-muted-foreground">Everything caught up!</p>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

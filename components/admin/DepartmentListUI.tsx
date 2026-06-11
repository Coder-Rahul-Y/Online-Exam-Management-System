"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Users, GraduationCap, Mail, User as UserIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DepartmentListUIProps {
  departments: any[]
}

export function DepartmentListUI({ departments }: DepartmentListUIProps) {
  const [selectedDept, setSelectedDept] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDeptClick = (dept: any) => {
    setSelectedDept(dept)
    setIsModalOpen(true)
  }

  const instructors = selectedDept?.users.filter((ud: any) => ud.role === "Instructor") || []
  const students = selectedDept?.users.filter((ud: any) => ud.role === "Student") || []

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {departments.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No departments found.
          </div>
        ) : (
          departments.map((dept) => (
            <Card 
              key={dept.id} 
              className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
              onClick={() => handleDeptClick(dept)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                    <CardDescription>Created on {new Date(dept.createdAt).toLocaleDateString()}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{dept.users.filter((ud: any) => ud.role === "Instructor").length} Faculty</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    <span>{dept.users.filter((ud: any) => ud.role === "Student").length} Students</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <DialogTitle className="text-2xl">{selectedDept?.name}</DialogTitle>
                <DialogDescription>
                  Department Membership Overview
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="faculty" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-4 mb-4">
              <TabsTrigger 
                value="faculty" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-4 py-2"
              >
                Faculties ({instructors.length})
              </TabsTrigger>
              <TabsTrigger 
                value="students" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-4 py-2"
              >
                Students ({students.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="faculty" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-3 pb-4">
                  {instructors.length === 0 ? (
                    <p className="text-center py-12 text-muted-foreground italic">No faculty members found.</p>
                  ) : (
                    instructors.map((ud: any) => (
                      <div key={ud.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {ud.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{ud.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {ud.email}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="font-mono text-[10px]">@{ud.username}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="students" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-3 pb-4">
                  {students.length === 0 ? (
                    <p className="text-center py-12 text-muted-foreground italic">No students found.</p>
                  ) : (
                    students.map((ud: any) => (
                      <div key={ud.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                            {ud.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{ud.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <UserIcon className="h-3 w-3" />
                              {ud.enrollmentNumber || "No Enrollment"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Username</p>
                          <p className="text-xs font-mono">{ud.username}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}

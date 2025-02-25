"use client"

import { Home, Settings, Users } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const items = [
  {
    title: "Hem",
    icon: Home,
    href: "/",
  },
  {
    title: "Hantera Stilmallar",
    icon: Users,
    href: "/style-templates",
  },
  {
    title: "Video Generator",
    icon: Settings,
    href: "/video-generator",
  },
  {
    title: "Video Editor",
    icon: Settings,
    href: "/editor",
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border p-4">
        <h2 className="font-semibold">Abanza</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
    
  )
}


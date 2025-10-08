/**
 * @fileoverview SocialsCard - Tarjeta con botones para compartir en redes sociales y reportar problemas.
 * 
 * Muestra una fila de botones con iconos de redes sociales y un botón para reportar
 * problemas de contenido, que activa el `ReportProblemDialog`.
 */
'use client';
import { Card, CardContent } from "@/components/ui/card";
import { Facebook, Flag } from "lucide-react";
import { useState } from "react";
import ReportProblemDialog from "./report-problem-dialog";
import type { TitleInfo } from "@/lib/types";

function DiscordIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36">
        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21a105.73,105.73,0,0,0,32.71,15.35,67.08,67.08,0,0,0,5.18-5.3,76.5,76.5,0,0,1-14.24-6.34,92.2,92.2,0,0,1-3.66-2.22,8.6,8.6,0,0,1-1.33-1.07,10.25,10.25,0,0,1-.54-1.2,95.32,95.32,0,0,1-2.07-5.59,94.62,94.62,0,0,1-1.2-4.11A93.46,93.46,0,0,1,14,56.11a95.7,95.7,0,0,1,.8-6.34A97.23,97.23,0,0,1,19.39,32.4,101.36,101.36,0,0,1,25,21.8,102,102,0,0,1,30.34,14a10.61,10.61,0,0,1,2.22-.8,6.15,6.15,0,0,1,1-.2A76.09,76.09,0,0,1,45.86,8.81a70,70,0,0,1,21.3,0,75.8,75.8,0,0,1,12.3,4.11,6.29,6.29,0,0,1,1,.2,10.52,10.52,0,0,1,2.22.8,102.1,102.1,0,0,1,5.3,7.76,101.46,101.46,0,0,1,5.66,10.64,97.14,97.14,0,0,1,4.58,17.3A94.5,94.5,0,0,1,94.92,62a95.17,95.17,0,0,1-1.74,11.2,10.28,10.28,0,0,1-.53,1.2,8.5,8.5,0,0,1-1.34,1.07,92.49,92.49,0,0,1-3.66,2.22,76.52,76.52,0,0,1-14.24,6.34,67.54,67.54,0,0,0,5.12,5.3,105.9,105.9,0,0,0,32.71-15.35C129.24,56.52,124.72,32.55,107.7,8.07ZM42.45,65.69C36.65,65.69,32,59.92,32,52.84s4.65-12.84,10.45-12.84,10.45,5.77,10.37,12.84S48.25,65.69,42.45,65.69Zm42.24,0C78.89,65.69,74.3,59.92,74.3,52.84s4.65-12.84,10.45-12.84,10.45,5.77,10.37,12.84S90.89,65.69,84.69,65.69Z"/>
      </svg>
    )
}

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.8 0-67.6-9.5-97.8-26.7l-7-4.1-72.5 19 19.3-70.6-4.5-7.4c-18.5-30.4-28.2-65.3-28.2-101.7 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.8-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
        </svg>
    )
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.1 464H35.5l184.3-206.3L38.9 48h147l97.2 130.3L389.2 48zm-24.8 393.1h39.7L159.2 88.5h-41.2L364.4 441.1z"/>
      </svg>
    )
}

const SocialLink = ({ href, icon, label, bgColor, hoverBgColor, onClick }: { href?: string, icon: React.ReactNode, label: string, bgColor: string, hoverBgColor: string, onClick?: () => void }) => {
    const Component = onClick ? 'button' : 'a';
    const props = onClick ? { onClick } : { href, target: "_blank", rel: "noopener noreferrer" };

    return (
        <Component
        {...props}
        className={`flex items-center justify-center p-3 rounded-lg transition-colors duration-300 ${bgColor} ${hoverBgColor} text-white gap-2`}
        >
        {icon}
        <span className="font-semibold text-sm">{label}</span>
        </Component>
    );
};

export default function SocialsCard({ titleInfo }: { titleInfo: TitleInfo }) {
    const [isReportDialogOpen, setReportDialogOpen] = useState(false);

    const socials = [
        { name: 'X', label: 'X', icon: <XIcon className="w-4 h-4 fill-current" />, href: '#', bgColor: 'bg-black', hoverBgColor: 'hover:bg-gray-800' },
        { name: 'Facebook', label: 'Facebook', icon: <Facebook size={20} />, href: '#', bgColor: 'bg-blue-600', hoverBgColor: 'hover:bg-blue-700' },
        { name: 'Discord', label: 'Discord', icon: <DiscordIcon className="w-5 h-5 fill-current" />, href: '#', bgColor: 'bg-indigo-600', hoverBgColor: 'hover:bg-indigo-700' },
        { name: 'WhatsApp', label: 'WhatsApp', icon: <WhatsAppIcon className="w-5 h-5 fill-current" />, href: '#', bgColor: 'bg-green-500', hoverBgColor: 'hover:bg-green-600' },
    ];
    
  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {socials.map(social => (
                  <SocialLink key={social.name} href={social.href} icon={social.icon} label={social.label} bgColor={social.bgColor} hoverBgColor={social.hoverBgColor} />
              ))}
              <SocialLink 
                key="report" 
                icon={<Flag size={20} />} 
                label="Reportar"
                bgColor="bg-destructive" 
                hoverBgColor="hover:bg-destructive/90"
                onClick={() => setReportDialogOpen(true)}
              />
          </div>
        </CardContent>
      </Card>
      <ReportProblemDialog 
        isOpen={isReportDialogOpen} 
        onOpenChange={setReportDialogOpen}
        titleInfo={titleInfo}
      />
    </>
  );
}

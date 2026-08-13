import { Calendar, MapPin } from 'lucide-react';
import { CloudinaryImage } from '../album/CloudinaryImage';
import { cn } from '../../shared/utils/cn';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  location?: string;
  publicId?: string; // For Cloudinary Image
  photoUrl?: string; // Legacy fallback
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  if (!events || events.length === 0) {
    return <div className="text-center py-12 text-theme-text-secondary">Nenhum evento registrado ainda.</div>;
  }

  // Ordenar por data (do mais antigo para o mais recente)
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="relative container mx-auto px-4 py-8 max-w-4xl">
      {/* Linha vertical central */}
      <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-theme-primary/30 transform md:-translate-x-1/2 rounded-full" />

      <div className="space-y-12">
        {sortedEvents.map((event, index) => {
          const isEven = index % 2 === 0;

          return (
            <div key={event.id} className="relative flex flex-col md:flex-row items-center w-full group">
              
              {/* Ponto na timeline */}
              <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-theme-primary rounded-full transform -translate-x-[7px] md:-translate-x-1/2 ring-4 ring-theme-bg shadow-sm z-10 transition-transform group-hover:scale-125 duration-300" />
              
              {/* Container de conteúdo - Desktop alterna lados, Mobile sempre na direita */}
              <div className={cn(
                "w-full pl-12 md:pl-0 md:w-1/2 md:px-8",
                isEven ? "md:text-right md:pr-8" : "md:ml-auto md:text-left md:pl-8"
              )}>
                <div className="bg-theme-card-bg border border-theme-card-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group-hover:border-theme-primary/50 relative">
                  
                  {/* Seta do Card (Desktop) */}
                  <div className={cn(
                    "hidden md:block absolute top-6 w-4 h-4 bg-theme-card-bg border-t border-r border-theme-card-border transform rotate-45 transition-colors group-hover:border-theme-primary/50",
                    isEven 
                      ? "-right-2 border-l-0 border-b-0" // Aponta para a direita 
                      : "-left-2 border-r-0 border-t-0 border-l border-b" // Aponta para a esquerda
                  )} />
                  
                  {/* Seta do Card (Mobile) */}
                  <div className="block md:hidden absolute top-6 -left-2 w-4 h-4 bg-theme-card-bg border-l border-b border-theme-card-border transform rotate-45 transition-colors group-hover:border-theme-primary/50" />

                  <div className={cn(
                    "flex flex-col gap-4",
                    isEven ? "md:items-end" : "md:items-start"
                  )}>
                    <div className="flex flex-wrap gap-3 items-center text-sm font-medium text-theme-primary">
                      <span className="flex items-center gap-1.5 bg-theme-primary/10 px-2.5 py-1 rounded-md">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.date).toLocaleDateString('pt-BR')}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1.5 text-theme-text-secondary">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-theme-text mb-2">{event.title}</h3>
                      <p className="text-theme-text-secondary leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    {(event.publicId || event.photoUrl) && (
                      <div className="w-full h-48 mt-2 rounded-xl overflow-hidden bg-theme-bg">
                        <CloudinaryImage 
                          publicId={event.publicId || event.photoUrl || ""} 
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

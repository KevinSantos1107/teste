import { Calendar, MapPin } from 'lucide-react';
import { CloudinaryImage } from '../album/CloudinaryImage';
import { cn } from '../../shared/utils/cn';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  location?: string;
  publicId?: string;
  photoUrl?: string;
  secretMessage?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12 text-theme-text-secondary">
        Nenhum evento registrado ainda.
      </div>
    );
  }

  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="relative container mx-auto px-4 py-8 max-w-4xl">
      {/* Linha vertical central — sempre no meio */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-theme-primary/30 transform -translate-x-1/2 rounded-full" />

      <div className="space-y-8 md:space-y-12">
        {sortedEvents.map((event, index) => {
          const isEven = index % 2 === 0;

          return (
            <div
              key={event.id}
              className="relative flex flex-row items-start w-full group"
            >
              {/* Ponto na timeline — sempre no centro */}
              <div className="absolute left-1/2 top-5 w-3 h-3 md:w-4 md:h-4 bg-theme-primary rounded-full transform -translate-x-1/2 ring-2 md:ring-4 ring-theme-bg shadow-sm z-10 transition-transform group-hover:scale-125 duration-300" />

              {/* Card — alterna lados em qualquer tamanho de tela */}
              <div
                className={cn(
                  'w-1/2 px-3 md:px-8',
                  isEven ? 'text-right pr-3 md:pr-8' : 'ml-auto text-left pl-3 md:pl-8'
                )}
              >
                <div className="bg-theme-card-bg border border-theme-card-border p-3 md:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group-hover:border-theme-primary/50 relative">
                  
                  {/* Seta do Card — isEven aponta para direita (em direção ao centro), odd aponta para esquerda */}
                  <div
                    className={cn(
                      'absolute top-4 md:top-6 w-3 h-3 md:w-4 md:h-4 bg-theme-card-bg border-theme-card-border transform rotate-45 transition-colors group-hover:border-theme-primary/50',
                      isEven
                        ? '-right-1.5 md:-right-2 border-t border-r border-l-0 border-b-0'
                        : '-left-1.5 md:-left-2 border-b border-l border-r-0 border-t-0'
                    )}
                  />

                  <div
                    className={cn(
                      'flex flex-col gap-2 md:gap-4',
                      isEven ? 'items-end' : 'items-start'
                    )}
                  >
                    {/* Data e localização */}
                    <div
                      className={cn(
                        'flex flex-col gap-1',
                        isEven ? 'items-end' : 'items-start'
                      )}
                    >
                      <span className="flex items-center gap-1 md:gap-1.5 bg-theme-primary/10 px-2 py-0.5 md:px-2.5 md:py-1 rounded-md">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                        <span className="text-[10px] md:text-sm font-medium text-theme-primary">
                          {new Date(`${event.date}T12:00:00`).toLocaleDateString('pt-BR')}
                        </span>
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-0.5 text-theme-text-secondary">
                          <MapPin className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 flex-shrink-0 opacity-60" />
                          <span className="text-[9px] md:text-xs opacity-70 truncate max-w-[80px] md:max-w-none">{event.location}</span>
                        </span>
                      )}
                    </div>

                    {/* Título e descrição */}
                    <div>
                      <h3 className="text-sm md:text-xl font-bold text-theme-text mb-1 md:mb-2 leading-tight">
                        {event.title}
                      </h3>
                      <p className="text-theme-text-secondary leading-relaxed text-[10px] md:text-base line-clamp-3 md:line-clamp-none">
                        {event.description}
                      </p>
                    </div>

                    {/* Foto em 9:16 */}
                    {(event.publicId || event.photoUrl) && (
                      <div className="w-full max-w-[140px] md:max-w-[320px] aspect-[9/16] mt-1 md:mt-4 rounded-xl overflow-hidden bg-theme-bg shadow-md">
                        <CloudinaryImage
                          publicId={event.publicId || event.photoUrl || ''}
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                    )}

                    {/* Mensagem secreta */}
                    {event.secretMessage && (
                      <div className="w-full mt-1 md:mt-2">
                        <details className="group/secret bg-theme-primary/5 border border-theme-primary/20 rounded-xl overflow-hidden cursor-pointer transition-all duration-300">
                          <summary className="flex items-center justify-center gap-2 p-2 md:p-3 font-medium text-theme-primary text-[10px] md:text-sm hover:bg-theme-primary/10 transition-colors list-none outline-none">
                            💌 Mensagem Secreta
                          </summary>
                          <div className="p-3 md:p-4 pt-1 text-[10px] md:text-sm text-theme-text-secondary italic border-t border-theme-primary/10 bg-theme-primary/5">
                            {event.secretMessage}
                          </div>
                        </details>
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

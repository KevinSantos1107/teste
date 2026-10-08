import { motion } from 'framer-motion';

interface WaitingForItem {
  id: string;
  name: string;
  avatarUrl?: string;
  done: boolean;
}

interface WaitingForProps {
  items: WaitingForItem[];
  label: string;
}

export function WaitingFor({ items, label }: WaitingForProps) {
  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;

  return (
    <div className="flex items-center gap-3" aria-live="polite">
      {/* Player dots */}
      <div className="flex items-center gap-1.5">
        {items.map((item) => (
          <div key={item.id} className="relative" title={`${item.name}: ${item.done ? 'Pronto' : 'Aguardando'}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 overflow-hidden transition-all duration-300 ${
                item.done
                  ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/20'
                  : 'border-white/20 bg-white/5 opacity-50'
              }`}
            >
              {item.avatarUrl ? (
                <img src={item.avatarUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <span className={item.done ? 'text-[var(--theme-primary)]' : 'text-white/40'}>
                  {item.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {item.done && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border border-black flex items-center justify-center"
              >
                <span className="text-[6px] text-white">✓</span>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Label with count */}
      <span className="text-white/50 text-sm font-medium">
        {label} {doneCount}/{total}
      </span>
    </div>
  );
}

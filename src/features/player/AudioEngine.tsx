/**
 * AudioEngine — componente invisível que mantém o elemento <audio> global vivo.
 * Deve ser montado UMA VEZ no Shell, independentemente da rota/página.
 * Não renderiza nada visível.
 */
import { useAudio } from './useAudio';

export function AudioEngine() {
  useAudio(); // Apenas monta o hook — ele gerencia o HTMLAudioElement
  return null;
}

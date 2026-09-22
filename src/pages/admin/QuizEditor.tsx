import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, updateDoc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import type { QuizQuestion, QuizConfig } from '../../features/quiz/schema';
import { DEFAULT_QUIZ_CONFIG } from '../../features/quiz/schema';
import { Plus, Save, Trash2, Settings, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '../../services/cloudinary/upload';

export default function QuizEditor() {
  const { config: siteConfig } = useSiteConfigStore();
  const siteId = siteConfig?.id || 'meu-site';

  const [config, setConfig] = useState<QuizConfig>(DEFAULT_QUIZ_CONFIG);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [secretFile, setSecretFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!siteId) return;
    const loadData = async () => {
      try {
        const configRef = doc(db, 'sites', siteId, 'quiz_config', 'main');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          setConfig({ ...DEFAULT_QUIZ_CONFIG, ...configSnap.data() } as QuizConfig);
        }

        const qRef = collection(db, 'sites', siteId, 'quiz_questions');
        const qSnap = await getDocs(query(qRef, orderBy('order', 'asc')));
        setQuestions(qSnap.docs.map(d => ({ id: d.id, ...d.data() } as QuizQuestion)));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [siteId]);

  const handleSave = async () => {
    if (!siteId) return;
    setIsSaving(true);
    try {
      let finalConfig = { ...config };
      
      // Upload file if new secret photo is selected
      if (secretFile && finalConfig.secretReward?.type === 'photo') {
        const res = await uploadImage(secretFile, `${siteId}/quiz`);
        finalConfig.secretReward.content = res.secureUrl;
        setConfig(finalConfig);
      }

      const configRef = doc(db, 'sites', siteId, 'quiz_config', 'main');
      await setDoc(configRef, finalConfig, { merge: true });

      // Save each question (basic loop for simplicity)
      for (const q of questions) {
        if (!q.id.startsWith('new-')) {
          await updateDoc(doc(db, 'sites', siteId, 'quiz_questions', q.id), { ...q });
        } else {
          // New doc
          const newDocRef = doc(collection(db, 'sites', siteId, 'quiz_questions'));
          const newQ = { ...q, id: newDocRef.id };
          await setDoc(newDocRef, newQ);
          // update local ID to avoid recreating
          setQuestions(prev => prev.map(p => p.id === q.id ? newQ : p));
        }
      }
      setSecretFile(null);
      alert('Salvo com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: `new-${Date.now()}`,
      siteId: siteId || '',
      question: '',
      options: [
        { id: 'opt-1', text: '' },
        { id: 'opt-2', text: '' },
        { id: 'opt-3', text: '' },
        { id: 'opt-4', text: '' }
      ],
      correctOptionId: 'opt-1',
      points: 100,
      active: true,
      order: questions.length
    };
    setQuestions([...questions, newQ]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir pergunta?')) return;
    if (!id.startsWith('new-') && siteId) {
      await deleteDoc(doc(db, 'sites', siteId, 'quiz_questions', id));
    }
    setQuestions(questions.filter(q => q.id !== id));
  };

  if (isLoading) return <div className="p-8 text-white">Carregando...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-400" /> Quiz do Casal
        </h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {isSaving ? 'Salvando...' : 'Salvar Tudo'}
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Configurações Gerais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="flex items-center gap-3 text-white">
            <input 
              type="checkbox" 
              checked={config.active} 
              onChange={e => setConfig({...config, active: e.target.checked})}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
            />
            Quiz Ativado
          </label>
          <label className="flex items-center gap-3 text-white">
            <input 
              type="checkbox" 
              checked={config.shuffleQuestions} 
              onChange={e => setConfig({...config, shuffleQuestions: e.target.checked})}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
            />
            Embaralhar Perguntas
          </label>
          <label className="flex items-center gap-3 text-white">
            <input 
              type="checkbox" 
              checked={config.shuffleOptions} 
              onChange={e => setConfig({...config, shuffleOptions: e.target.checked})}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
            />
            Embaralhar Alternativas
          </label>
        </div>
        
        <div className="mt-8 border-t border-white/10 pt-6">
          <h3 className="text-lg font-bold text-white mb-4">Recompensa Secreta (100% de Acerto)</h3>
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 text-white">
              <span className="text-sm">Tipo de Recompensa:</span>
              <select 
                value={config.secretReward?.type || 'none'}
                onChange={e => setConfig({...config, secretReward: { type: e.target.value as any, content: config.secretReward?.content || '' }})}
                className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="none">Nenhuma</option>
                <option value="message">Mensagem Especial</option>
                <option value="photo">Foto Secreta (URL)</option>
              </select>
            </label>
            
            {config.secretReward?.type !== 'none' && (
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70">
                  {config.secretReward?.type === 'message' ? 'Escreva a mensagem especial:' : 'Escolha a foto secreta:'}
                </label>
                
                {config.secretReward?.type === 'message' ? (
                  <textarea 
                    value={config.secretReward?.content || ''}
                    onChange={e => setConfig({...config, secretReward: { type: 'message', content: e.target.value }})}
                    placeholder="Ex: Você ganhou uma massagem grátis hoje! ❤️"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none min-h-[80px]"
                  />
                ) : (
                  <div className="flex flex-col gap-4">
                    {secretFile ? (
                      <div className="relative w-full max-w-xs aspect-video bg-black/30 rounded-xl overflow-hidden border border-white/10">
                        <img 
                          src={URL.createObjectURL(secretFile)} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : config.secretReward?.content ? (
                      <div className="relative w-full max-w-xs aspect-video bg-black/30 rounded-xl overflow-hidden border border-white/10">
                        <img 
                          src={config.secretReward.content} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full max-w-xs aspect-video bg-white/5 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 text-white/30">
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-sm">Nenhuma foto adicionada ainda</span>
                      </div>
                    )}
                    <label className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-3 text-white cursor-pointer transition-colors max-w-xs">
                      <ImageIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">{config.secretReward?.content || secretFile ? 'Trocar Foto' : 'Selecionar Foto'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setSecretFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Perguntas</h2>
          <button
            onClick={handleAddQuestion}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Nova Pergunta
          </button>
        </div>

        {questions.map((q, index) => (
          <div key={q.id} className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={q.question}
                  onChange={e => {
                    const newQs = [...questions];
                    newQs[index].question = e.target.value;
                    setQuestions(newQs);
                  }}
                  placeholder="Ex: Onde foi nosso primeiro beijo?"
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <button 
                onClick={() => handleDelete(q.id)}
                className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-white/10">
              {q.options.map((opt, optIdx) => (
                <div key={opt.id} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={q.correctOptionId === opt.id}
                    onChange={() => {
                      const newQs = [...questions];
                      newQs[index].correctOptionId = opt.id;
                      setQuestions(newQs);
                    }}
                    className="w-5 h-5 text-emerald-500 bg-white/10 border-white/20 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={opt.text}
                    onChange={e => {
                      const newQs = [...questions];
                      newQs[index].options[optIdx].text = e.target.value;
                      setQuestions(newQs);
                    }}
                    placeholder={`Alternativa ${optIdx + 1}`}
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

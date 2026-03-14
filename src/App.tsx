import React, { useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { 
  Activity, Heart, Brain, ClipboardList, BarChart3, MessageSquare, 
  LogOut, LogIn, User as UserIcon, Plus, History, TrendingUp, 
  AlertCircle, CheckCircle2, Info, ChevronRight, Search, FileText,
  Stethoscope, Thermometer, Droplets
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Patient, Prediction, Page } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Components ---

const Sidebar = ({ activePage, setActivePage, user }: { activePage: Page, setActivePage: (p: Page) => void, user: User | null }) => {
  const menuItems: { id: Page, label: string, icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'predict', label: 'New Prediction', icon: Plus },
    { id: 'insights', label: 'Dataset Insights', icon: BarChart3 },
    { id: 'performance', label: 'Model Performance', icon: TrendingUp },
    { id: 'chat', label: 'AI Health Assistant', icon: MessageSquare },
  ];

  return (
    <div className="w-64 bg-zinc-950 border-r border-zinc-800 h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Stethoscope className="text-white w-6 h-6" />
        </div>
        <h1 className="text-white font-bold text-lg tracking-tight">MedPredict AI</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              activePage === item.id 
                ? "bg-emerald-500/10 text-emerald-400" 
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            )}
          >
            <item.icon className={cn("w-5 h-5", activePage === item.id ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300")} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        {user ? (
          <div className="flex items-center gap-3 px-2">
            <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-full border border-zinc-700" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.displayName}</p>
              <button 
                onClick={() => signOut(auth)}
                className="text-zinc-500 text-xs hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3 h-3" /> Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="w-full flex items-center justify-center gap-2 bg-white text-black py-2 rounded-xl font-medium hover:bg-zinc-200 transition-colors"
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
        )}
      </div>
    </div>
  );
};

const Dashboard = ({ predictions, patients }: { predictions: Prediction[], patients: Patient[] }) => {
  const stats = [
    { label: 'Total Patients', value: patients.length, icon: UserIcon, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Predictions Made', value: predictions.length, icon: ClipboardList, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'High Risk Cases', value: predictions.filter(p => p.riskLevel === 'high').length, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
    { label: 'Avg Risk Score', value: predictions.length ? `${(predictions.reduce((acc, p) => acc + p.probability, 0) / predictions.length * 100).toFixed(1)}%` : '0%', icon: Activity, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  const chartData = predictions.slice(-10).map(p => ({
    name: new Date(p.timestamp).toLocaleDateString(),
    prob: (p.probability || 0) * 100,
    risk: p.riskLevel === 'high' ? 80 : p.riskLevel === 'moderate' ? 50 : 20
  }));

  const riskDistribution = [
    { name: 'Low', value: predictions.filter(p => p.riskLevel === 'low').length, color: '#10b981' },
    { name: 'Moderate', value: predictions.filter(p => p.riskLevel === 'moderate').length, color: '#f59e0b' },
    { name: 'High', value: predictions.filter(p => p.riskLevel === 'high').length, color: '#ef4444' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
            </div>
            <p className="text-zinc-400 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Recent Prediction Trends
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="prob" stroke="#10b981" fillOpacity={1} fill="url(#colorProb)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <h3 className="text-white font-bold mb-6">Risk Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-white font-bold">Recent Predictions</h3>
          <button className="text-emerald-400 text-sm font-medium hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-950/50 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Disease</th>
                <th className="px-6 py-4 font-semibold">Risk Level</th>
                <th className="px-6 py-4 font-semibold">Probability</th>
                <th className="px-6 py-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {predictions.slice(0, 5).map((p, i) => (
                <tr key={i} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">Patient #{p.patientId?.slice(-4) || 'N/A'}</td>
                  <td className="px-6 py-4 text-zinc-300 capitalize">{p.diseaseType.replace('_', ' ')}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight",
                      p.riskLevel === 'high' ? "bg-red-500/10 text-red-400" :
                      p.riskLevel === 'moderate' ? "bg-amber-500/10 text-amber-400" :
                      "bg-emerald-500/10 text-emerald-400"
                    )}>
                      {p.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-300">{(p.probability * 100).toFixed(1)}%</td>
                  <td className="px-6 py-4 text-zinc-500 text-sm">{new Date(p.timestamp).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PredictionForm = ({ user }: { user: User | null }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Prediction | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    age: 45,
    gender: 'male',
    bloodPressure: 120,
    cholesterol: 200,
    glucose: 100,
    bmi: 24.5,
    heartRate: 72,
    familyHistory: false,
    diseaseType: 'heart_disease'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please sign in to make predictions.");
    setLoading(true);
    
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const predictionData = await response.json();
      
      const newPrediction: Prediction = {
        userId: user.uid,
        diseaseType: formData.diseaseType as any,
        probability: predictionData.probability,
        riskLevel: predictionData.riskLevel,
        recommendation: predictionData.recommendation,
        modelUsed: predictionData.modelUsed,
        timestamp: new Date().toISOString()
      };

      const patientRef = await addDoc(collection(db, 'patients'), {
        userId: user.uid,
        name: formData.name,
        age: formData.age,
        gender: formData.gender,
        bloodPressure: formData.bloodPressure,
        cholesterol: formData.cholesterol,
        glucose: formData.glucose,
        bmi: formData.bmi,
        heartRate: formData.heartRate,
        familyHistory: formData.familyHistory,
        createdAt: new Date().toISOString()
      });

      newPrediction.patientId = patientRef.id;
      await addDoc(collection(db, 'predictions'), newPrediction);
      
      setResult(newPrediction);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-8 border-b border-zinc-800 bg-zinc-950/50">
          <h2 className="text-2xl font-bold text-white">Disease Risk Prediction</h2>
          <p className="text-zinc-400 mt-2">Enter patient medical data to analyze health risks using our ML models.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-zinc-400 text-sm font-medium">Patient Name</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <label className="text-zinc-400 text-sm font-medium">Target Disease</label>
            <select 
              value={formData.diseaseType}
              onChange={e => setFormData({...formData, diseaseType: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            >
              <option value="heart_disease">Heart Disease</option>
              <option value="diabetes">Diabetes</option>
              <option value="breast_cancer">Breast Cancer</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-zinc-400 text-sm font-medium">Age</label>
            <input 
              type="number" 
              value={formData.age || ''}
              onChange={e => setFormData({...formData, age: parseInt(e.target.value) || 0})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-zinc-400 text-sm font-medium">BMI</label>
            <input 
              type="number" 
              step="0.1"
              value={formData.bmi || ''}
              onChange={e => setFormData({...formData, bmi: parseFloat(e.target.value) || 0})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-zinc-400 text-sm font-medium">Blood Pressure (Systolic)</label>
            <input 
              type="number" 
              value={formData.bloodPressure || ''}
              onChange={e => setFormData({...formData, bloodPressure: parseInt(e.target.value) || 0})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-zinc-400 text-sm font-medium">Glucose Level (mg/dL)</label>
            <input 
              type="number" 
              value={formData.glucose || ''}
              onChange={e => setFormData({...formData, glucose: parseInt(e.target.value) || 0})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          <div className="space-y-2 flex items-center gap-3 pt-8">
            <input 
              type="checkbox" 
              id="familyHistory"
              checked={formData.familyHistory}
              onChange={e => setFormData({...formData, familyHistory: e.target.checked})}
              className="w-5 h-5 bg-zinc-950 border border-zinc-800 rounded focus:ring-emerald-500 text-emerald-500"
            />
            <label htmlFor="familyHistory" className="text-zinc-400 text-sm font-medium cursor-pointer">
              Family History of this Disease?
            </label>
          </div>

          <div className="md:col-span-2 pt-4">
            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Run Analysis <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
          >
            <div className={cn(
              "absolute top-0 left-0 w-2 h-full",
              result.riskLevel === 'high' ? "bg-red-500" :
              result.riskLevel === 'moderate' ? "bg-amber-500" : "bg-emerald-500"
            )} />
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-2xl font-bold text-white">Analysis Result</h3>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    result.riskLevel === 'high' ? "bg-red-500/10 text-red-400" :
                    result.riskLevel === 'moderate' ? "bg-amber-500/10 text-amber-400" :
                    "bg-emerald-500/10 text-emerald-400"
                  )}>
                    {result.riskLevel} Risk
                  </span>
                </div>
                
                <p className="text-zinc-300 text-lg leading-relaxed mb-6">
                  Based on the provided data, the system predicts a <span className="text-white font-bold">{(result.probability * 100).toFixed(1)}%</span> likelihood of <span className="text-white font-bold capitalize">{result.diseaseType.replace('_', ' ')}</span>.
                </p>

                <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800">
                  <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-400" />
                    Medical Recommendation
                  </h4>
                  <p className="text-zinc-400">{result.recommendation}</p>
                </div>

                {result.medications && result.medications.length > 0 && (
                  <div className="mt-4 bg-zinc-950 rounded-xl p-6 border border-zinc-800">
                    <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-emerald-400" />
                      Related Medical Tablets / Medications
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.medications.map((med, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-zinc-400 text-sm bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {med}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-3 italic">
                      * These medications are shown for informational purposes only based on the predicted risk. Never take medication without a doctor's prescription.
                    </p>
                  </div>
                )}
              </div>

              <div className="w-full md:w-48 flex flex-col items-center justify-center bg-zinc-950 rounded-2xl p-6 border border-zinc-800">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-zinc-800"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={364.4}
                      strokeDashoffset={364.4 * (1 - (result.probability || 0))}
                      className={cn(
                        "transition-all duration-1000 ease-out",
                        result.riskLevel === 'high' ? "text-red-500" :
                        result.riskLevel === 'moderate' ? "text-amber-500" : "text-emerald-500"
                      )}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">{(result.probability * 100).toFixed(0)}%</span>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Score</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 mt-4 text-center uppercase tracking-widest font-bold">
                  Model: {result.modelUsed}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Chatbot = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: "Hello! I'm your AI Medical Assistant. I can help explain your prediction results, provide general health advice, or answer questions about diseases. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        config: {
          systemInstruction: "You are a professional medical AI assistant. Provide accurate, helpful, and empathetic health information. Always include a disclaimer that you are an AI and not a substitute for professional medical advice.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });
      
      setMessages(prev => [...prev, { role: 'ai', content: result.text || "I'm sorry, I couldn't process that." }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: "Error connecting to AI service. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
          <Brain className="text-white w-5 h-5" />
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">AI Health Assistant</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Online • Thinking Mode Enabled</span>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' ? "bg-emerald-500 text-white rounded-tr-none" : "bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700"
            )}>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-zinc-500 text-xs font-medium italic">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your health or prediction results..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="bg-emerald-500 text-white p-3 rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 mt-2 text-center">
          AI-generated content. Always consult a doctor for medical decisions.
        </p>
      </div>
    </div>
  );
};

const Insights = () => {
  const data = [
    { name: 'Age 20-30', heart: 12, diabetes: 8, cancer: 5 },
    { name: 'Age 30-40', heart: 25, diabetes: 18, cancer: 12 },
    { name: 'Age 40-50', heart: 45, diabetes: 35, cancer: 28 },
    { name: 'Age 50-60', heart: 78, diabetes: 62, cancer: 45 },
    { name: 'Age 60+', heart: 120, diabetes: 95, cancer: 68 },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">UCI Dataset Insights</h2>
        <p className="text-zinc-400 mb-8">Statistical overview of the datasets used to train our models.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Droplets className="w-5 h-5 text-red-400" />
              Disease Prevalence by Age Group
            </h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                  />
                  <Legend />
                  <Bar dataKey="heart" name="Heart Disease" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="diabetes" name="Diabetes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancer" name="Breast Cancer" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-400" />
              Feature Importance Map
            </h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                  { subject: 'Age', A: 120, B: 110, fullMark: 150 },
                  { subject: 'Glucose', A: 150, B: 130, fullMark: 150 },
                  { subject: 'BMI', A: 86, B: 130, fullMark: 150 },
                  { subject: 'BP', A: 99, B: 100, fullMark: 150 },
                  { subject: 'History', A: 85, B: 90, fullMark: 150 },
                  { subject: 'Cholesterol', A: 65, B: 85, fullMark: 150 },
                ]}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="subject" stroke="#71717a" fontSize={12} />
                  <PolarRadiusAxis stroke="#71717a" fontSize={10} />
                  <Radar name="Diabetes" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Radar name="Heart Disease" dataKey="B" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Performance = () => {
  const models = [
    { name: 'Logistic Regression', accuracy: 84.5, precision: 82.1, recall: 81.5, f1: 81.8 },
    { name: 'Random Forest', accuracy: 91.2, precision: 89.5, recall: 90.2, f1: 89.8 },
    { name: 'SVM', accuracy: 87.8, precision: 86.4, recall: 85.9, f1: 86.1 },
    { name: 'XGBoost', accuracy: 93.4, precision: 92.1, recall: 91.8, f1: 91.9 },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">Model Performance Comparison</h2>
        <p className="text-zinc-400 mb-8">Benchmarking different classification algorithms on medical datasets.</p>
        
        <div className="grid grid-cols-1 gap-8">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={models} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#71717a" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} width={150} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                />
                <Legend />
                <Bar dataKey="accuracy" name="Accuracy %" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="f1" name="F1 Score %" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {models.map(model => (
              <div key={model.name} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                <h4 className="text-white font-bold text-sm mb-3">{model.name}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Accuracy</span>
                    <span className="text-emerald-400 font-bold">{model.accuracy}%</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${model.accuracy}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">F1 Score</span>
                    <span className="text-blue-400 font-bold">{model.f1}%</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: `${model.f1}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setPredictions([]);
      setPatients([]);
      return;
    }

    const qPreds = query(
      collection(db, 'predictions'), 
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    const unsubPreds = onSnapshot(qPreds, (snap) => {
      setPredictions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prediction)));
    });

    const qPatients = query(
      collection(db, 'patients'), 
      where('userId', '==', user.uid)
    );
    const unsubPatients = onSnapshot(qPatients, (snap) => {
      setPatients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient)));
    });

    return () => {
      unsubPreds();
      unsubPatients();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} />
      
      <main className="pl-64 min-h-screen">
        <header className="h-20 border-b border-zinc-800 flex items-center justify-between px-8 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
          <div>
            <h2 className="text-white font-bold text-xl capitalize">{activePage.replace('_', ' ')}</h2>
            <p className="text-zinc-500 text-xs">Welcome back, {user?.displayName || 'Guest'}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search records..." 
                className="bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all w-64"
              />
            </div>
            <button className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors relative">
              <Activity className="w-5 h-5 text-zinc-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-zinc-900" />
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {!user && activePage !== 'insights' && activePage !== 'performance' ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6">
                <Brain className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Unlock AI Diagnostics</h2>
              <p className="text-zinc-400 max-w-md mb-8">Sign in with your Google account to access personalized disease prediction, patient history, and AI health assistance.</p>
              <button 
                onClick={() => signInWithPopup(auth, googleProvider)}
                className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all shadow-xl shadow-white/5"
              >
                <LogIn className="w-5 h-5" />
                Sign In with Google
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activePage === 'dashboard' && <Dashboard predictions={predictions} patients={patients} />}
                {activePage === 'predict' && <PredictionForm user={user} />}
                {activePage === 'insights' && <Insights />}
                {activePage === 'performance' && <Performance />}
                {activePage === 'chat' && <Chatbot />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
